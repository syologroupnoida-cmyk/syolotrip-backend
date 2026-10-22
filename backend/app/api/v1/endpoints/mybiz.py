from typing import Optional, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.mybiz import (
    CompanyRegisterRequest,
    CompanyUpdateRequest,
    CompanyResponse,
    EmployeeAddRequest,
    EmployeeUpdateRequest,
    EmployeeResponse,
    TravelPolicyUpdateRequest,
    TravelPolicyResponse,
    TripRequestCreateRequest,
    TripRequestActionRequest,
    TripRequestResponse,
    InvoiceResponse,
    SpendingReportResponse,
    MyBizUserContext,
)
from backend.app.services.mybiz_service import MyBizService
from backend.app.api.v1.deps import get_current_user

router = APIRouter(prefix="/mybiz", tags=["myBiz – Business Travel"])


# ─────────────── Business Account Registration ───────────────


@router.post(
    "/register",
    response_model=ApiResponse[CompanyResponse],
    status_code=status.HTTP_201_CREATED,
)
async def register_business_account(
    req: CompanyRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.register_company(req, current_user)
    await db.commit()
    return ApiResponse(
        success=True,
        data=result,
        message="Business account registered successfully",
    )


# ─────────────── User Business Context ───────────────


@router.get("/context", response_model=ApiResponse[MyBizUserContext])
async def get_biz_context(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    ctx = await service.get_user_biz_context(current_user)
    return ApiResponse(success=True, data=ctx)


# ─────────────── Company Profile ───────────────


@router.get("/company", response_model=ApiResponse[CompanyResponse])
async def get_company_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.get_company(current_user)
    return ApiResponse(success=True, data=result)


@router.put("/company", response_model=ApiResponse[CompanyResponse])
async def update_company_profile(
    req: CompanyUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.update_company(req, current_user)
    await db.commit()
    return ApiResponse(success=True, data=result, message="Company updated")


# ─────────────── Employee Management ───────────────


@router.get("/employees", response_model=ApiResponse[List[EmployeeResponse]])
async def list_employees(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.list_employees(current_user)
    return ApiResponse(success=True, data=result)


@router.post(
    "/employees",
    response_model=ApiResponse[EmployeeResponse],
    status_code=status.HTTP_201_CREATED,
)
async def add_employee(
    req: EmployeeAddRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.add_employee(req, current_user)
    await db.commit()
    return ApiResponse(
        success=True, data=result, message="Employee added successfully"
    )


@router.put("/employees/{employee_id}", response_model=ApiResponse[EmployeeResponse])
async def update_employee(
    employee_id: str,
    req: EmployeeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.update_employee(employee_id, req, current_user)
    await db.commit()
    return ApiResponse(success=True, data=result, message="Employee updated")


@router.delete("/employees/{employee_id}", response_model=ApiResponse)
async def remove_employee(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.remove_employee(employee_id, current_user)
    await db.commit()
    return ApiResponse(success=True, data=result)


# ─────────────── Travel Policy ───────────────


@router.get("/policy", response_model=ApiResponse[TravelPolicyResponse])
async def get_travel_policy(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.get_policy(current_user)
    return ApiResponse(success=True, data=result)


@router.put("/policy", response_model=ApiResponse[TravelPolicyResponse])
async def update_travel_policy(
    req: TravelPolicyUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.update_policy(req, current_user)
    await db.commit()
    return ApiResponse(success=True, data=result, message="Policy updated")


# ─────────────── Trip Requests ───────────────


@router.post(
    "/trip-requests",
    response_model=ApiResponse[TripRequestResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_trip_request(
    req: TripRequestCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.create_trip_request(req, current_user)
    await db.commit()
    return ApiResponse(
        success=True, data=result, message="Trip request submitted for approval"
    )


@router.get("/trip-requests", response_model=ApiResponse[List[TripRequestResponse]])
async def list_trip_requests(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.list_trip_requests(current_user, status_filter)
    return ApiResponse(success=True, data=result)


@router.post(
    "/trip-requests/{request_id}/approve",
    response_model=ApiResponse[TripRequestResponse],
)
async def approve_trip_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.approve_trip_request(request_id, current_user)
    await db.commit()
    return ApiResponse(success=True, data=result, message="Trip request approved")


@router.post(
    "/trip-requests/{request_id}/reject",
    response_model=ApiResponse[TripRequestResponse],
)
async def reject_trip_request(
    request_id: str,
    req: TripRequestActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.reject_trip_request(request_id, req, current_user)
    await db.commit()
    return ApiResponse(success=True, data=result, message="Trip request rejected")


# ─────────────── Company Bookings ───────────────


@router.get("/bookings", response_model=ApiResponse[list])
async def list_company_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.list_company_bookings(current_user)
    return ApiResponse(success=True, data=result)


# ─────────────── Invoices ───────────────


@router.get("/invoices", response_model=ApiResponse[List[InvoiceResponse]])
async def list_invoices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.list_invoices(current_user)
    return ApiResponse(success=True, data=result)


@router.post(
    "/invoices/{booking_id}",
    response_model=ApiResponse[InvoiceResponse],
    status_code=status.HTTP_201_CREATED,
)
async def generate_invoice(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.generate_invoice_for_booking(booking_id, current_user)
    await db.commit()
    return ApiResponse(success=True, data=result, message="Invoice generated")


# ─────────────── Reports ───────────────


@router.get("/reports", response_model=ApiResponse[SpendingReportResponse])
async def get_spending_report(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MyBizService(db)
    result = await service.get_spending_report(current_user)
    return ApiResponse(success=True, data=result)
