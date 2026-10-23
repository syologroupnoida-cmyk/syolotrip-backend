from typing import Optional, List
from pydantic import BaseModel, Field
from backend.app.schemas.hotel import HotelRoomResponse


class PartnerRegisterRequest(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=255)
    business_type: str = Field("HOTELIER", description="HOTELIER or HOMESTAY_HOST")
    phone: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None


class PartnerProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None


class PartnerProfileResponse(BaseModel):
    id: str
    user_id: str
    business_name: str
    business_type: str
    phone: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    country: str = "India"
    tax_id: Optional[str] = None
    status: str
    is_verified: bool
    commission_rate: float
    is_commission_active: bool
    rejection_reason: Optional[str] = None
    verified_at: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}


class PartnerPropertyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    property_type: str = Field("HOTEL", description="HOTEL or HOMESTAY only")
    star_rating: int = Field(4, ge=1, le=5)
    address: str
    city: str
    country: str = "India"
    neighborhood: Optional[str] = None
    overview: str
    amenities: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    featured_image: str
    images: Optional[List[str]] = None
    starting_price: float = Field(..., gt=0)
    currency: str = "INR"


class PartnerPropertyUpdate(BaseModel):
    name: Optional[str] = None
    property_type: Optional[str] = None
    star_rating: Optional[int] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    neighborhood: Optional[str] = None
    overview: Optional[str] = None
    amenities: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    featured_image: Optional[str] = None
    images: Optional[List[str]] = None
    starting_price: Optional[float] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None


class PartnerPropertyResponse(BaseModel):
    id: str
    partner_id: Optional[str] = None
    name: str
    property_type: str
    publication_status: str
    admin_rejection_reason: Optional[str] = None
    approved_at: Optional[str] = None
    star_rating: int
    guest_rating: float
    rating_label: str
    review_count: int
    address: str
    city: str
    country: str
    neighborhood: Optional[str] = None
    overview: str
    amenities: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    featured_image: str
    images: Optional[List[str]] = None
    starting_price: float
    currency: str
    is_active: bool
    featured: bool
    rooms: Optional[List[HotelRoomResponse]] = None

    model_config = {"from_attributes": True}


class PartnerRoomCreate(BaseModel):
    room_type: str = Field(..., min_length=2)
    bed_type: str = "King Bed"
    max_occupancy: int = Field(2, ge=1)
    price_per_night: float = Field(..., gt=0)
    taxes_per_night: float = 0.0
    available_rooms: int = Field(5, ge=0)
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None


class PartnerRoomUpdate(BaseModel):
    room_type: Optional[str] = None
    bed_type: Optional[str] = None
    max_occupancy: Optional[int] = None
    price_per_night: Optional[float] = None
    taxes_per_night: Optional[float] = None
    available_rooms: Optional[int] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    is_available: Optional[bool] = None


class DailyInventorySetRequest(BaseModel):
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="YYYY-MM-DD")
    available_rooms: int = Field(..., ge=0)
    price_override: Optional[float] = None
    is_blocked: bool = False


class DailyInventoryResponse(BaseModel):
    id: str
    room_id: str
    date: str
    available_rooms: int
    price_override: Optional[float] = None
    is_blocked: bool

    model_config = {"from_attributes": True}


class AdminPropertyReviewRequest(BaseModel):
    rejection_reason: Optional[str] = None
