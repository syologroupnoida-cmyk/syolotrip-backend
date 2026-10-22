from typing import Optional, List
from pydantic import BaseModel, Field


class CabResponse(BaseModel):
    id: str
    cab_type: str
    vehicle_model: str
    city: str
    pickup_area: str
    drop_area: str
    driver_name: str
    driver_rating: float
    capacity: int
    base_fare: float
    currency: str
    eta_minutes: int
    features: List[str] = []
    is_simulated: bool

    model_config = {"from_attributes": True}


class CabSearchParams(BaseModel):
    city: Optional[str] = None
    cab_type: Optional[str] = None
    max_price: Optional[float] = None


class CabCreate(BaseModel):
    cab_type: str
    vehicle_model: str
    city: str
    pickup_area: str
    drop_area: str
    driver_name: str = "Verified Chauffeur"
    driver_rating: float = 4.9
    capacity: int = 4
    base_fare: float
    currency: str = "INR"
    eta_minutes: int = 15
    features: List[str] = []
