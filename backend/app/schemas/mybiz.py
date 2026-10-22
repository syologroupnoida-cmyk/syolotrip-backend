from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# ────────────────────────── Company Registration ──────────────────────────


class CompanyRegisterRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    gstin: Optional[str] = Field(None, max_length=20)
    pan: Optional[str] = Field(None, max_length=20)
    industry: Optional[str] = Field(None, max_length=100)
    employee_count_range: str = Field("1-10")
    billing_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    website: Optional[str] = None


class CompanyUpdateRequest(BaseModel):
    company_name: Optional[str] = Field(None, max_length=200)
    gstin: Optional[str] = Field(None, max_length=20)
    pan: Optional[str] = Field(None, max_length=20)
    industry: Optional[str] = None
    employee_count_range: Optional[str] = None
    billing_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    website: Optional[str] = None


class CompanyResponse(BaseModel):
    id: str
    name: str
    gstin: Optional[str] = None
    pan: Optional[str] = None
    industry: Optional[str] = None
    employee_count_range: str
    billing_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    website: Optional[str] = None
    is_active: bool
    created_at: str
    employee_count: int = 0

    model_config = {"from_attributes": True}


# ────────────────────────── Company Employees ──────────────────────────


class EmployeeAddRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=200)
    role: str = "BIZ_EMPLOYEE"
    department: Optional[str] = None
    designation: Optional[str] = None


class EmployeeBulkAddRequest(BaseModel):
    employees: List[EmployeeAddRequest]


class EmployeeUpdateRequest(BaseModel):
    role: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[str] = None


class EmployeeResponse(BaseModel):
    id: str
    company_id: str
    user_id: Optional[str] = None
    email: str
    full_name: str
    role: str
    department: Optional[str] = None
    designation: Optional[str] = None
    status: str
    created_at: str

    model_config = {"from_attributes": True}


# ────────────────────────── Travel Policy ──────────────────────────


class TravelPolicyRules(BaseModel):
    flight_max_budget: float = 25000.0
    hotel_max_budget: float = 8000.0
    cab_max_budget: float = 3000.0
    bus_max_budget: float = 2000.0
    train_max_budget: float = 3000.0
    package_max_budget: float = 50000.0
    allowed_flight_classes: List[str] = ["ECONOMY"]
    allowed_hotel_stars: List[int] = [3, 4]
    advance_booking_days: int = 3
    requires_approval: bool = True
    international_requires_approval: bool = True


class TravelPolicyCreateRequest(BaseModel):
    name: str = "Default Policy"
    rules: TravelPolicyRules = TravelPolicyRules()


class TravelPolicyUpdateRequest(BaseModel):
    name: Optional[str] = None
    rules: Optional[TravelPolicyRules] = None
    is_active: Optional[bool] = None


class TravelPolicyResponse(BaseModel):
    id: str
    company_id: str
    name: str
    is_active: bool
    rules: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


# ────────────────────────── Trip Requests ──────────────────────────


class TripRequestCreateRequest(BaseModel):
    service_type: str = "FLIGHT"
    trip_purpose: Optional[str] = None
    destination: Optional[str] = None
    travel_date_from: Optional[str] = None
    travel_date_to: Optional[str] = None
    estimated_amount: float = 0.0


class TripRequestActionRequest(BaseModel):
    rejection_reason: Optional[str] = None


class TripRequestResponse(BaseModel):
    id: str
    company_id: str
    employee_user_id: str
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    approver_user_id: Optional[str] = None
    service_type: str
    trip_purpose: Optional[str] = None
    destination: Optional[str] = None
    travel_date_from: Optional[str] = None
    travel_date_to: Optional[str] = None
    estimated_amount: float
    status: str
    rejection_reason: Optional[str] = None
    booking_id: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}


# ────────────────────────── Invoices ──────────────────────────


class InvoiceResponse(BaseModel):
    id: str
    company_id: str
    booking_id: str
    invoice_number: str
    gstin: Optional[str] = None
    company_name: str
    billing_address: Optional[str] = None
    base_amount: float
    tax_amount: float
    total_amount: float
    currency: str
    tax_breakdown: Optional[Dict[str, Any]] = None
    created_at: str

    model_config = {"from_attributes": True}


# ────────────────────────── Reports ──────────────────────────


class SpendingReportResponse(BaseModel):
    total_bookings: int
    total_spend: float
    total_tax: float
    average_booking_value: float
    spend_by_service: Dict[str, float] = {}
    spend_by_department: Dict[str, float] = {}
    spend_by_month: Dict[str, float] = {}
    pending_approvals: int = 0
    active_employees: int = 0


# ────────────────────────── myBiz User Context ──────────────────────────


class MyBizUserContext(BaseModel):
    """Returned along with auth /me to tell the frontend this user is part of a business account."""
    is_biz_user: bool = False
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    biz_role: Optional[str] = None
    department: Optional[str] = None
