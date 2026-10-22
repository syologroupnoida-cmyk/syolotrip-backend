import uuid
import secrets
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract

from backend.app.models.user import User
from backend.app.models.booking import Booking, BookingStatus
from backend.app.models.mybiz import (
    Company,
    CompanyEmployee,
    CompanyEmployeeRole,
    CompanyEmployeeStatus,
    TravelPolicy,
    TripRequest,
    TripRequestStatus,
    CompanyInvoice,
)
from backend.app.schemas.mybiz import (
    CompanyRegisterRequest,
    CompanyUpdateRequest,
    CompanyResponse,
    EmployeeAddRequest,
    EmployeeUpdateRequest,
    EmployeeResponse,
    TravelPolicyCreateRequest,
    TravelPolicyUpdateRequest,
    TravelPolicyResponse,
    TripRequestCreateRequest,
    TripRequestActionRequest,
    TripRequestResponse,
    InvoiceResponse,
    SpendingReportResponse,
    MyBizUserContext,
)


def _generate_invoice_number() -> str:
    suffix = "".join(secrets.choice("0123456789") for _ in range(8))
    return f"SSJBIZ-{suffix}"


class MyBizService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ─────────────── Helper: get employee link ───────────────

    async def _get_employee_link(
        self, user: User
    ) -> Optional[CompanyEmployee]:
        q = select(CompanyEmployee).where(
            CompanyEmployee.user_id == user.id,
            CompanyEmployee.status == CompanyEmployeeStatus.ACTIVE.value,
        )
        result = await self.db.execute(q)
        return result.scalar_one_or_none()

    async def _require_biz_admin(self, user: User) -> CompanyEmployee:
        emp = await self._get_employee_link(user)
        if not emp or emp.role != CompanyEmployeeRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Business admin access required",
            )
        return emp

    async def _require_biz_manager_or_admin(self, user: User) -> CompanyEmployee:
        emp = await self._get_employee_link(user)
        if not emp or emp.role not in (
            CompanyEmployeeRole.ADMIN.value,
            CompanyEmployeeRole.MANAGER.value,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Business manager or admin access required",
            )
        return emp

    async def _require_any_biz_role(self, user: User) -> CompanyEmployee:
        emp = await self._get_employee_link(user)
        if not emp:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not part of any business account",
            )
        return emp

    # ─────────────── User context ───────────────

    async def get_user_biz_context(self, user: User) -> MyBizUserContext:
        emp = await self._get_employee_link(user)
        if not emp:
            return MyBizUserContext(is_biz_user=False)
        q = select(Company).where(Company.id == emp.company_id)
        result = await self.db.execute(q)
        company = result.scalar_one_or_none()
        return MyBizUserContext(
            is_biz_user=True,
            company_id=str(emp.company_id),
            company_name=company.name if company else None,
            biz_role=emp.role,
            department=emp.department,
        )

    # ─────────────── Company Registration ───────────────

    async def register_company(
        self, req: CompanyRegisterRequest, user: User
    ) -> CompanyResponse:
        # Check user isn't already in a company
        existing = await self._get_employee_link(user)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already part of a business account",
            )

        company = Company(
            name=req.company_name.strip(),
            gstin=req.gstin.strip().upper() if req.gstin else None,
            pan=req.pan.strip().upper() if req.pan else None,
            industry=req.industry,
            employee_count_range=req.employee_count_range,
            billing_address=req.billing_address,
            city=req.city,
            state=req.state,
            pincode=req.pincode,
            website=req.website,
            is_active=True,
            created_by_user_id=user.id,
        )
        self.db.add(company)
        await self.db.flush()

        # Add creator as admin employee
        admin_emp = CompanyEmployee(
            company_id=company.id,
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=CompanyEmployeeRole.ADMIN.value,
            status=CompanyEmployeeStatus.ACTIVE.value,
        )
        self.db.add(admin_emp)
        await self.db.flush()

        # Create default travel policy
        default_policy = TravelPolicy(
            company_id=company.id,
            name="Default Policy",
            is_active=True,
            rules={
                "flight_max_budget": 25000,
                "hotel_max_budget": 8000,
                "cab_max_budget": 3000,
                "bus_max_budget": 2000,
                "train_max_budget": 3000,
                "package_max_budget": 50000,
                "allowed_flight_classes": ["ECONOMY"],
                "allowed_hotel_stars": [3, 4],
                "advance_booking_days": 3,
                "requires_approval": True,
                "international_requires_approval": True,
            },
        )
        self.db.add(default_policy)

        return CompanyResponse(
            id=str(company.id),
            name=company.name,
            gstin=company.gstin,
            pan=company.pan,
            industry=company.industry,
            employee_count_range=company.employee_count_range,
            billing_address=company.billing_address,
            city=company.city,
            state=company.state,
            pincode=company.pincode,
            website=company.website,
            is_active=company.is_active,
            created_at=company.created_at.isoformat(),
            employee_count=1,
        )

    # ─────────────── Company Profile ───────────────

    async def get_company(self, user: User) -> CompanyResponse:
        emp = await self._require_any_biz_role(user)
        q = select(Company).where(Company.id == emp.company_id)
        result = await self.db.execute(q)
        company = result.scalar_one_or_none()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        count_q = select(func.count()).where(
            CompanyEmployee.company_id == company.id,
            CompanyEmployee.status == CompanyEmployeeStatus.ACTIVE.value,
        )
        count_result = await self.db.execute(count_q)
        emp_count = count_result.scalar() or 0

        return CompanyResponse(
            id=str(company.id),
            name=company.name,
            gstin=company.gstin,
            pan=company.pan,
            industry=company.industry,
            employee_count_range=company.employee_count_range,
            billing_address=company.billing_address,
            city=company.city,
            state=company.state,
            pincode=company.pincode,
            website=company.website,
            is_active=company.is_active,
            created_at=company.created_at.isoformat(),
            employee_count=emp_count,
        )

    async def update_company(
        self, req: CompanyUpdateRequest, user: User
    ) -> CompanyResponse:
        emp = await self._require_biz_admin(user)
        q = select(Company).where(Company.id == emp.company_id)
        result = await self.db.execute(q)
        company = result.scalar_one_or_none()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        if req.company_name is not None:
            company.name = req.company_name.strip()
        if req.gstin is not None:
            company.gstin = req.gstin.strip().upper() if req.gstin else None
        if req.pan is not None:
            company.pan = req.pan.strip().upper() if req.pan else None
        if req.industry is not None:
            company.industry = req.industry
        if req.employee_count_range is not None:
            company.employee_count_range = req.employee_count_range
        if req.billing_address is not None:
            company.billing_address = req.billing_address
        if req.city is not None:
            company.city = req.city
        if req.state is not None:
            company.state = req.state
        if req.pincode is not None:
            company.pincode = req.pincode
        if req.website is not None:
            company.website = req.website

        return await self.get_company(user)

    # ─────────────── Employees ───────────────

    async def list_employees(self, user: User) -> List[EmployeeResponse]:
        emp = await self._require_biz_admin(user)
        q = (
            select(CompanyEmployee)
            .where(CompanyEmployee.company_id == emp.company_id)
            .order_by(CompanyEmployee.created_at.desc())
        )
        result = await self.db.execute(q)
        employees = result.scalars().all()
        return [
            EmployeeResponse(
                id=str(e.id),
                company_id=str(e.company_id),
                user_id=str(e.user_id) if e.user_id else None,
                email=e.email,
                full_name=e.full_name,
                role=e.role,
                department=e.department,
                designation=e.designation,
                status=e.status,
                created_at=e.created_at.isoformat(),
            )
            for e in employees
        ]

    async def add_employee(
        self, req: EmployeeAddRequest, user: User
    ) -> EmployeeResponse:
        admin_emp = await self._require_biz_admin(user)

        # Check if employee already exists in this company
        exists_q = select(CompanyEmployee).where(
            CompanyEmployee.company_id == admin_emp.company_id,
            CompanyEmployee.email == req.email.lower().strip(),
        )
        result = await self.db.execute(exists_q)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already part of your company",
            )

        # Check if user account exists
        user_q = select(User).where(User.email == req.email.lower().strip())
        user_result = await self.db.execute(user_q)
        existing_user = user_result.scalar_one_or_none()

        new_emp = CompanyEmployee(
            company_id=admin_emp.company_id,
            user_id=existing_user.id if existing_user else None,
            email=req.email.lower().strip(),
            full_name=req.full_name.strip(),
            role=req.role if req.role in [r.value for r in CompanyEmployeeRole] else CompanyEmployeeRole.EMPLOYEE.value,
            department=req.department,
            designation=req.designation,
            status=(
                CompanyEmployeeStatus.ACTIVE.value
                if existing_user
                else CompanyEmployeeStatus.INVITED.value
            ),
        )
        self.db.add(new_emp)
        await self.db.flush()

        return EmployeeResponse(
            id=str(new_emp.id),
            company_id=str(new_emp.company_id),
            user_id=str(new_emp.user_id) if new_emp.user_id else None,
            email=new_emp.email,
            full_name=new_emp.full_name,
            role=new_emp.role,
            department=new_emp.department,
            designation=new_emp.designation,
            status=new_emp.status,
            created_at=new_emp.created_at.isoformat(),
        )

    async def update_employee(
        self, employee_id: str, req: EmployeeUpdateRequest, user: User
    ) -> EmployeeResponse:
        admin_emp = await self._require_biz_admin(user)
        try:
            emp_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")

        q = select(CompanyEmployee).where(
            CompanyEmployee.id == emp_uuid,
            CompanyEmployee.company_id == admin_emp.company_id,
        )
        result = await self.db.execute(q)
        emp = result.scalar_one_or_none()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")

        if req.role is not None:
            emp.role = req.role
        if req.department is not None:
            emp.department = req.department
        if req.designation is not None:
            emp.designation = req.designation
        if req.status is not None:
            emp.status = req.status

        return EmployeeResponse(
            id=str(emp.id),
            company_id=str(emp.company_id),
            user_id=str(emp.user_id) if emp.user_id else None,
            email=emp.email,
            full_name=emp.full_name,
            role=emp.role,
            department=emp.department,
            designation=emp.designation,
            status=emp.status,
            created_at=emp.created_at.isoformat(),
        )

    async def remove_employee(self, employee_id: str, user: User) -> dict:
        admin_emp = await self._require_biz_admin(user)
        try:
            emp_uuid = uuid.UUID(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid employee ID")

        q = select(CompanyEmployee).where(
            CompanyEmployee.id == emp_uuid,
            CompanyEmployee.company_id == admin_emp.company_id,
        )
        result = await self.db.execute(q)
        emp = result.scalar_one_or_none()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")

        # Cannot remove yourself if you're the only admin
        if emp.user_id == user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove yourself from the company",
            )

        emp.status = CompanyEmployeeStatus.DEACTIVATED.value
        return {"message": "Employee deactivated successfully"}

    # ─────────────── Travel Policies ───────────────

    async def get_policy(self, user: User) -> TravelPolicyResponse:
        emp = await self._require_any_biz_role(user)
        q = select(TravelPolicy).where(
            TravelPolicy.company_id == emp.company_id,
            TravelPolicy.is_active == True,
        )
        result = await self.db.execute(q)
        policy = result.scalar_one_or_none()
        if not policy:
            raise HTTPException(status_code=404, detail="No active travel policy found")
        return TravelPolicyResponse(
            id=str(policy.id),
            company_id=str(policy.company_id),
            name=policy.name,
            is_active=policy.is_active,
            rules=policy.rules,
            created_at=policy.created_at.isoformat(),
            updated_at=policy.updated_at.isoformat(),
        )

    async def update_policy(
        self, req: TravelPolicyUpdateRequest, user: User
    ) -> TravelPolicyResponse:
        admin_emp = await self._require_biz_admin(user)
        q = select(TravelPolicy).where(
            TravelPolicy.company_id == admin_emp.company_id,
            TravelPolicy.is_active == True,
        )
        result = await self.db.execute(q)
        policy = result.scalar_one_or_none()
        if not policy:
            raise HTTPException(status_code=404, detail="No active travel policy found")

        if req.name is not None:
            policy.name = req.name
        if req.rules is not None:
            policy.rules = req.rules.model_dump()
        if req.is_active is not None:
            policy.is_active = req.is_active

        return TravelPolicyResponse(
            id=str(policy.id),
            company_id=str(policy.company_id),
            name=policy.name,
            is_active=policy.is_active,
            rules=policy.rules,
            created_at=policy.created_at.isoformat(),
            updated_at=policy.updated_at.isoformat(),
        )

    # ─────────────── Trip Requests ───────────────

    async def create_trip_request(
        self, req: TripRequestCreateRequest, user: User
    ) -> TripRequestResponse:
        emp = await self._require_any_biz_role(user)
        trip_req = TripRequest(
            company_id=emp.company_id,
            employee_user_id=user.id,
            service_type=req.service_type.upper(),
            trip_purpose=req.trip_purpose,
            destination=req.destination,
            travel_date_from=req.travel_date_from,
            travel_date_to=req.travel_date_to,
            estimated_amount=req.estimated_amount,
            status=TripRequestStatus.PENDING.value,
        )
        self.db.add(trip_req)
        await self.db.flush()

        return TripRequestResponse(
            id=str(trip_req.id),
            company_id=str(trip_req.company_id),
            employee_user_id=str(trip_req.employee_user_id),
            employee_name=emp.full_name,
            employee_email=emp.email,
            service_type=trip_req.service_type,
            trip_purpose=trip_req.trip_purpose,
            destination=trip_req.destination,
            travel_date_from=trip_req.travel_date_from,
            travel_date_to=trip_req.travel_date_to,
            estimated_amount=float(trip_req.estimated_amount),
            status=trip_req.status,
            booking_id=str(trip_req.booking_id) if trip_req.booking_id else None,
            created_at=trip_req.created_at.isoformat(),
        )

    async def list_trip_requests(
        self, user: User, status_filter: Optional[str] = None
    ) -> List[TripRequestResponse]:
        emp = await self._require_any_biz_role(user)

        q = select(TripRequest).where(TripRequest.company_id == emp.company_id)

        # Employees only see their own; admins/managers see all
        if emp.role == CompanyEmployeeRole.EMPLOYEE.value:
            q = q.where(TripRequest.employee_user_id == user.id)

        if status_filter:
            q = q.where(TripRequest.status == status_filter.upper())

        q = q.order_by(TripRequest.created_at.desc())
        result = await self.db.execute(q)
        requests = result.scalars().all()

        responses = []
        for tr in requests:
            # Get employee name
            emp_q = select(CompanyEmployee).where(
                CompanyEmployee.company_id == emp.company_id,
                CompanyEmployee.user_id == tr.employee_user_id,
            )
            emp_result = await self.db.execute(emp_q)
            req_emp = emp_result.scalar_one_or_none()

            responses.append(
                TripRequestResponse(
                    id=str(tr.id),
                    company_id=str(tr.company_id),
                    employee_user_id=str(tr.employee_user_id),
                    employee_name=req_emp.full_name if req_emp else "Unknown",
                    employee_email=req_emp.email if req_emp else None,
                    service_type=tr.service_type,
                    trip_purpose=tr.trip_purpose,
                    destination=tr.destination,
                    travel_date_from=tr.travel_date_from,
                    travel_date_to=tr.travel_date_to,
                    estimated_amount=float(tr.estimated_amount),
                    status=tr.status,
                    rejection_reason=tr.rejection_reason,
                    booking_id=str(tr.booking_id) if tr.booking_id else None,
                    created_at=tr.created_at.isoformat(),
                )
            )
        return responses

    async def approve_trip_request(
        self, request_id: str, user: User
    ) -> TripRequestResponse:
        mgr = await self._require_biz_manager_or_admin(user)
        try:
            req_uuid = uuid.UUID(request_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid request ID")

        q = select(TripRequest).where(
            TripRequest.id == req_uuid,
            TripRequest.company_id == mgr.company_id,
        )
        result = await self.db.execute(q)
        tr = result.scalar_one_or_none()
        if not tr:
            raise HTTPException(status_code=404, detail="Trip request not found")
        if tr.status != TripRequestStatus.PENDING.value:
            raise HTTPException(
                status_code=400, detail="Trip request is not in pending status"
            )

        tr.status = TripRequestStatus.APPROVED.value
        tr.approver_user_id = user.id

        emp_q = select(CompanyEmployee).where(
            CompanyEmployee.company_id == mgr.company_id,
            CompanyEmployee.user_id == tr.employee_user_id,
        )
        emp_result = await self.db.execute(emp_q)
        req_emp = emp_result.scalar_one_or_none()

        return TripRequestResponse(
            id=str(tr.id),
            company_id=str(tr.company_id),
            employee_user_id=str(tr.employee_user_id),
            employee_name=req_emp.full_name if req_emp else "Unknown",
            employee_email=req_emp.email if req_emp else None,
            service_type=tr.service_type,
            trip_purpose=tr.trip_purpose,
            destination=tr.destination,
            travel_date_from=tr.travel_date_from,
            travel_date_to=tr.travel_date_to,
            estimated_amount=float(tr.estimated_amount),
            status=tr.status,
            booking_id=str(tr.booking_id) if tr.booking_id else None,
            created_at=tr.created_at.isoformat(),
        )

    async def reject_trip_request(
        self, request_id: str, req: TripRequestActionRequest, user: User
    ) -> TripRequestResponse:
        mgr = await self._require_biz_manager_or_admin(user)
        try:
            req_uuid = uuid.UUID(request_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid request ID")

        q = select(TripRequest).where(
            TripRequest.id == req_uuid,
            TripRequest.company_id == mgr.company_id,
        )
        result = await self.db.execute(q)
        tr = result.scalar_one_or_none()
        if not tr:
            raise HTTPException(status_code=404, detail="Trip request not found")
        if tr.status != TripRequestStatus.PENDING.value:
            raise HTTPException(
                status_code=400, detail="Trip request is not in pending status"
            )

        tr.status = TripRequestStatus.REJECTED.value
        tr.approver_user_id = user.id
        tr.rejection_reason = req.rejection_reason

        emp_q = select(CompanyEmployee).where(
            CompanyEmployee.company_id == mgr.company_id,
            CompanyEmployee.user_id == tr.employee_user_id,
        )
        emp_result = await self.db.execute(emp_q)
        req_emp = emp_result.scalar_one_or_none()

        return TripRequestResponse(
            id=str(tr.id),
            company_id=str(tr.company_id),
            employee_user_id=str(tr.employee_user_id),
            employee_name=req_emp.full_name if req_emp else "Unknown",
            employee_email=req_emp.email if req_emp else None,
            service_type=tr.service_type,
            trip_purpose=tr.trip_purpose,
            destination=tr.destination,
            travel_date_from=tr.travel_date_from,
            travel_date_to=tr.travel_date_to,
            estimated_amount=float(tr.estimated_amount),
            status=tr.status,
            rejection_reason=tr.rejection_reason,
            booking_id=str(tr.booking_id) if tr.booking_id else None,
            created_at=tr.created_at.isoformat(),
        )

    # ─────────────── Invoices ───────────────

    async def list_invoices(self, user: User) -> List[InvoiceResponse]:
        emp = await self._require_biz_admin(user)
        q = (
            select(CompanyInvoice)
            .where(CompanyInvoice.company_id == emp.company_id)
            .order_by(CompanyInvoice.created_at.desc())
        )
        result = await self.db.execute(q)
        invoices = result.scalars().all()
        return [
            InvoiceResponse(
                id=str(inv.id),
                company_id=str(inv.company_id),
                booking_id=str(inv.booking_id),
                invoice_number=inv.invoice_number,
                gstin=inv.gstin,
                company_name=inv.company_name,
                billing_address=inv.billing_address,
                base_amount=float(inv.base_amount),
                tax_amount=float(inv.tax_amount),
                total_amount=float(inv.total_amount),
                currency=inv.currency,
                tax_breakdown=inv.tax_breakdown,
                created_at=inv.created_at.isoformat(),
            )
            for inv in invoices
        ]

    async def generate_invoice_for_booking(
        self, booking_id: str, user: User
    ) -> InvoiceResponse:
        emp = await self._require_any_biz_role(user)

        # Get company
        q = select(Company).where(Company.id == emp.company_id)
        result = await self.db.execute(q)
        company = result.scalar_one_or_none()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        # Get booking
        try:
            b_uuid = uuid.UUID(booking_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid booking ID")

        bq = select(Booking).where(Booking.id == b_uuid)
        bresult = await self.db.execute(bq)
        booking = bresult.scalar_one_or_none()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Check if invoice already exists
        exists_q = select(CompanyInvoice).where(
            CompanyInvoice.booking_id == b_uuid,
            CompanyInvoice.company_id == emp.company_id,
        )
        eres = await self.db.execute(exists_q)
        existing = eres.scalar_one_or_none()
        if existing:
            return InvoiceResponse(
                id=str(existing.id),
                company_id=str(existing.company_id),
                booking_id=str(existing.booking_id),
                invoice_number=existing.invoice_number,
                gstin=existing.gstin,
                company_name=existing.company_name,
                billing_address=existing.billing_address,
                base_amount=float(existing.base_amount),
                tax_amount=float(existing.tax_amount),
                total_amount=float(existing.total_amount),
                currency=existing.currency,
                tax_breakdown=existing.tax_breakdown,
                created_at=existing.created_at.isoformat(),
            )

        # Generate invoice
        base = float(booking.base_amount)
        tax = float(booking.taxes_amount)
        total = float(booking.total_amount)
        cgst = round(tax * 0.5, 2)
        sgst = round(tax * 0.5, 2)

        invoice = CompanyInvoice(
            company_id=emp.company_id,
            booking_id=b_uuid,
            invoice_number=_generate_invoice_number(),
            gstin=company.gstin,
            company_name=company.name,
            billing_address=company.billing_address,
            base_amount=base,
            tax_amount=tax,
            total_amount=total,
            currency=booking.currency,
            tax_breakdown={
                "cgst": cgst,
                "sgst": sgst,
                "igst": 0.0,
                "total_gst": tax,
            },
        )
        self.db.add(invoice)
        await self.db.flush()

        return InvoiceResponse(
            id=str(invoice.id),
            company_id=str(invoice.company_id),
            booking_id=str(invoice.booking_id),
            invoice_number=invoice.invoice_number,
            gstin=invoice.gstin,
            company_name=invoice.company_name,
            billing_address=invoice.billing_address,
            base_amount=float(invoice.base_amount),
            tax_amount=float(invoice.tax_amount),
            total_amount=float(invoice.total_amount),
            currency=invoice.currency,
            tax_breakdown=invoice.tax_breakdown,
            created_at=invoice.created_at.isoformat(),
        )

    # ─────────────── Company Bookings ───────────────

    async def list_company_bookings(self, user: User) -> list:
        emp = await self._require_biz_admin(user)

        # Get all user IDs in this company
        emp_q = select(CompanyEmployee.user_id).where(
            CompanyEmployee.company_id == emp.company_id,
            CompanyEmployee.user_id.isnot(None),
        )
        emp_result = await self.db.execute(emp_q)
        user_ids = [row[0] for row in emp_result.all()]

        if not user_ids:
            return []

        bq = (
            select(Booking)
            .where(Booking.user_id.in_(user_ids))
            .order_by(Booking.created_at.desc())
        )
        bresult = await self.db.execute(bq)
        bookings = bresult.scalars().all()

        results = []
        for b in bookings:
            # Find employee name
            emp_name_q = select(CompanyEmployee).where(
                CompanyEmployee.company_id == emp.company_id,
                CompanyEmployee.user_id == b.user_id,
            )
            enr = await self.db.execute(emp_name_q)
            ce = enr.scalar_one_or_none()

            results.append({
                "id": str(b.id),
                "booking_reference": b.booking_reference,
                "employee_name": ce.full_name if ce else "Unknown",
                "employee_email": ce.email if ce else None,
                "department": ce.department if ce else None,
                "service_type": b.service_type,
                "status": b.status,
                "total_amount": float(b.total_amount),
                "currency": b.currency,
                "created_at": b.created_at.isoformat(),
            })
        return results

    # ─────────────── Reports ───────────────

    async def get_spending_report(self, user: User) -> SpendingReportResponse:
        emp = await self._require_biz_admin(user)

        # All user IDs
        emp_q = select(CompanyEmployee.user_id, CompanyEmployee.department).where(
            CompanyEmployee.company_id == emp.company_id,
            CompanyEmployee.user_id.isnot(None),
        )
        emp_result = await self.db.execute(emp_q)
        emp_rows = emp_result.all()
        user_ids = [row[0] for row in emp_rows]
        user_dept_map = {row[0]: row[1] or "Unassigned" for row in emp_rows}

        if not user_ids:
            return SpendingReportResponse(
                total_bookings=0,
                total_spend=0.0,
                total_tax=0.0,
                average_booking_value=0.0,
                pending_approvals=0,
                active_employees=len(user_ids),
            )

        # Bookings
        bq = select(Booking).where(
            Booking.user_id.in_(user_ids),
            Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.PENDING.value]),
        )
        bresult = await self.db.execute(bq)
        bookings = bresult.scalars().all()

        total_spend = 0.0
        total_tax = 0.0
        spend_by_service: Dict[str, float] = {}
        spend_by_department: Dict[str, float] = {}
        spend_by_month: Dict[str, float] = {}

        for b in bookings:
            total_spend += float(b.total_amount)
            total_tax += float(b.taxes_amount)
            svc = b.service_type
            spend_by_service[svc] = spend_by_service.get(svc, 0.0) + float(b.total_amount)

            dept = user_dept_map.get(b.user_id, "Unassigned")
            spend_by_department[dept] = spend_by_department.get(dept, 0.0) + float(b.total_amount)

            month_key = b.created_at.strftime("%Y-%m")
            spend_by_month[month_key] = spend_by_month.get(month_key, 0.0) + float(b.total_amount)

        total_bookings = len(bookings)
        avg = total_spend / total_bookings if total_bookings > 0 else 0.0

        # Pending approvals
        pq = select(func.count()).where(
            TripRequest.company_id == emp.company_id,
            TripRequest.status == TripRequestStatus.PENDING.value,
        )
        presult = await self.db.execute(pq)
        pending = presult.scalar() or 0

        # Active employees
        aq = select(func.count()).where(
            CompanyEmployee.company_id == emp.company_id,
            CompanyEmployee.status == CompanyEmployeeStatus.ACTIVE.value,
        )
        aresult = await self.db.execute(aq)
        active_emps = aresult.scalar() or 0

        return SpendingReportResponse(
            total_bookings=total_bookings,
            total_spend=round(total_spend, 2),
            total_tax=round(total_tax, 2),
            average_booking_value=round(avg, 2),
            spend_by_service=spend_by_service,
            spend_by_department=spend_by_department,
            spend_by_month=spend_by_month,
            pending_approvals=pending,
            active_employees=active_emps,
        )
