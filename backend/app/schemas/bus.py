from typing import Optional
from pydantic import BaseModel, Field


class BusSearchParams(BaseModel):
    from_city: Optional[str] = None
    to_city: Optional[str] = None
    travel_date: Optional[str] = None
    seats: int = Field(1, ge=1, le=10)
    max_price: Optional[float] = None


class BusCreate(BaseModel):
    operator_name: str
    bus_type: str
    from_city: str
    to_city: str
    boarding_point: str
    dropping_point: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    available_seats: int = 30
    base_fare: float
    rating: float = 4.5
    currency: str = "INR"


class BusResponse(BaseModel):
    id: str
    operator_name: str
    bus_type: str
    from_city: str
    to_city: str
    boarding_point: str
    dropping_point: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    available_seats: int
    base_fare: float
    rating: float
    currency: str
    is_simulated: bool

    model_config = {"from_attributes": True}
