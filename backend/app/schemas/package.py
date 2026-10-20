from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PackageSearchParams(BaseModel):
    destination: Optional[str] = None
    max_price: Optional[float] = None
    min_days: Optional[int] = None
    max_days: Optional[int] = None


class PackageCreate(BaseModel):
    title: str
    destination: str
    duration_days: int
    duration_nights: int
    overview: str
    inclusions: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
    itinerary: Optional[List[Dict[str, Any]]] = None
    price_per_person: float
    currency: str = "INR"
    featured_image: str
    rating: float = 4.8
    available_capacity: int = 20


class PackageResponse(BaseModel):
    id: str
    title: str
    destination: str
    duration_days: int
    duration_nights: int
    overview: str
    inclusions: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
    itinerary: Optional[List[Dict[str, Any]]] = None
    price_per_person: float
    currency: str
    featured_image: str
    rating: float
    available_capacity: int
    is_simulated: bool

    model_config = {"from_attributes": True}
