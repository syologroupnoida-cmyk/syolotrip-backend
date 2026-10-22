from typing import Optional
from pydantic import BaseModel, Field


class TrainResponse(BaseModel):
    id: str
    train_number: str
    train_name: str
    train_type: str
    from_station_code: str
    from_station_name: str
    from_city: str
    to_station_code: str
    to_station_name: str
    to_city: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    train_class: str
    available_seats: int
    base_fare: float
    rating: float
    currency: str
    is_simulated: bool

    model_config = {"from_attributes": True}


class TrainSearchParams(BaseModel):
    from_city: Optional[str] = None
    to_city: Optional[str] = None
    from_station: Optional[str] = None
    to_station: Optional[str] = None
    train_class: Optional[str] = None
    max_price: Optional[float] = None


class TrainCreate(BaseModel):
    train_number: str
    train_name: str
    train_type: str = "Superfast Express"
    from_station_code: str
    from_station_name: str
    from_city: str
    to_station_code: str
    to_station_name: str
    to_city: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    train_class: str = "AC Chair Car (CC)"
    available_seats: int = 120
    base_fare: float
    rating: float = 4.8
    currency: str = "INR"
