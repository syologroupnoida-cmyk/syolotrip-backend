from typing import Optional, List
from pydantic import BaseModel, Field


class AirportSchema(BaseModel):
    code: str
    name: str
    city: str
    country: str


class FlightSearchParams(BaseModel):
    from_city: Optional[str] = None
    to_city: Optional[str] = None
    from_code: Optional[str] = None
    to_code: Optional[str] = None
    departure_date: Optional[str] = None
    passengers: int = Field(1, ge=1, le=9)
    cabin_class: Optional[str] = None
    max_price: Optional[float] = None
    non_stop: Optional[bool] = None


class FlightCreate(BaseModel):
    airline: str
    airline_code: str
    flight_number: str
    aircraft: str
    origin_code: str
    origin_name: str
    origin_city: str
    origin_country: str = "India"
    destination_code: str
    destination_name: str
    destination_city: str
    destination_country: str = "India"
    departure_time: str
    arrival_time: str
    duration_minutes: int
    stops: int = 0
    stops_info: Optional[str] = None
    cabin_class: str = "ECONOMY"
    available_seats: int = 50
    base_fare: float
    taxes: float = 0.0
    total_price: float
    currency: str = "INR"
    logo_url: Optional[str] = None
    baggage_info: Optional[str] = "2 × 23kg checked"
    emissions_kg: Optional[int] = None
    tags: Optional[List[str]] = None


class FlightResponse(BaseModel):
    id: str
    airline: str
    airline_code: str
    flight_number: str
    aircraft: str
    origin: AirportSchema
    destination: AirportSchema
    departure_time: str
    arrival_time: str
    duration_minutes: int
    stops: int
    stops_info: Optional[str] = None
    cabin_class: str
    available_seats: int
    base_fare: float
    taxes: float
    total_price: float
    currency: str
    is_simulated: bool
    logo_url: Optional[str] = None
    baggage_info: Optional[str] = None
    tags: Optional[List[str]] = None

    model_config = {"from_attributes": True}
