from typing import Optional, List
from pydantic import BaseModel, Field


class HotelRoomResponse(BaseModel):
    id: str
    room_type: str
    bed_type: str
    max_occupancy: int
    price_per_night: float
    taxes_per_night: float
    available_rooms: int
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    is_available: bool

    model_config = {"from_attributes": True}


class HotelSearchParams(BaseModel):
    city: Optional[str] = None
    min_stars: Optional[int] = None
    max_price: Optional[float] = None
    amenities: Optional[List[str]] = None
    featured_only: Optional[bool] = None


class HotelCreate(BaseModel):
    name: str
    star_rating: int = 4
    guest_rating: float = 8.8
    rating_label: str = "Excellent"
    review_count: int = 100
    address: str
    city: str
    country: str = "India"
    neighborhood: Optional[str] = None
    overview: str
    amenities: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    featured_image: str
    images: Optional[List[str]] = None
    starting_price: float
    currency: str = "INR"
    featured: bool = False


class HotelResponse(BaseModel):
    id: str
    name: str
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
    is_simulated: bool
    featured: bool
    rooms: Optional[List[HotelRoomResponse]] = None

    model_config = {"from_attributes": True}
