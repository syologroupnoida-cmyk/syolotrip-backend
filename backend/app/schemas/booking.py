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
    item_type: str  # "FLIGHT", "HOTEL_ROOM", "BUS", "PACKAGE", "TRAIN", "CAB"
    item_reference_id: str
    quantity: int = Field(1, ge=1)
    hotel_id: Optional[str] = None
    room_id: Optional[str] = None
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None


class BookingCreateRequest(BaseModel):
    service_type: str = "FLIGHT"  # FLIGHT, HOTEL, BUS, PACKAGE, COMBO, TRAIN, CAB
    guest_name: Optional[str] = None
    contact_email: EmailStr
    contact_phone: str
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    items: List[BookingItemCreate]
    passengers: List[PassengerSchema]
    promo_code: Optional[str] = None
    has_insurance: bool = False
    idempotency_key: Optional[str] = None


class BookingCancelRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)
    cancellation_token: Optional[str] = None


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
    hotel_id: Optional[str] = None
    room_id: Optional[str] = None
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    unit_price: float
    total_price: float
    meta_data: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


class BookingResponse(BaseModel):
    id: str
    booking_reference: str
    user_id: Optional[str] = None
    guest_name: Optional[str] = None
    service_type: str
    status: str
    provider: str
    is_simulated: bool
    contact_email: str
    contact_phone: str
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    cancellation_token: Optional[str] = None
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

