from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class PassengerSchema(BaseModel):
    title: str = "Mr"
    first_name: str
    last_name: str
    passenger_type: str = "ADULT"
    gender: str = "MALE"
    date_of_birth: Optional[str] = None
    passport_number: Optional[str] = None
    seat_preference: Optional[str] = None

    model_config = {"from_attributes": True}


class BookingItemCreate(BaseModel):
    item_type: str  # "FLIGHT", "HOTEL_ROOM", "BUS", "PACKAGE"
    item_reference_id: str
    quantity: int = Field(1, ge=1)
    meta_data: Optional[Dict[str, Any]] = None


class BookingCreateRequest(BaseModel):
    service_type: str = "FLIGHT"  # FLIGHT, HOTEL, BUS, PACKAGE, COMBO
    contact_email: EmailStr
    contact_phone: str
    items: List[BookingItemCreate]
    passengers: List[PassengerSchema]
    promo_code: Optional[str] = None
    has_insurance: bool = False
    idempotency_key: Optional[str] = None


class BookingCancelRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)


class BookingStatusHistoryResponse(BaseModel):
    from_status: str
    to_status: str
    reason: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}


class BookingItemResponse(BaseModel):
    id: str
    item_type: str
    item_reference_id: str
    title: str
    quantity: int
    unit_price: float
    total_price: float
    meta_data: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


class BookingResponse(BaseModel):
    id: str
    booking_reference: str
    user_id: Optional[str] = None
    service_type: str
    status: str
    provider: str
    is_simulated: bool
    contact_email: str
    contact_phone: str
    base_amount: float
    taxes_amount: float
    discount_amount: float
    total_amount: float
    currency: str
    cancellation_reason: Optional[str] = None
    details_snapshot: Optional[Dict[str, Any]] = None
    created_at: str
    passengers: Optional[List[PassengerSchema]] = None
    items: Optional[List[BookingItemResponse]] = None
    status_history: Optional[List[BookingStatusHistoryResponse]] = None

    model_config = {"from_attributes": True}
