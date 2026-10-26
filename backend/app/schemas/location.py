from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class LocationOption(BaseModel):
    category: str
    code: Optional[str] = None
    name: str
    city: str
    country: Optional[str] = None
    role: str = "both"  # origin, destination, both


class RouteValidationRequest(BaseModel):
    category: str  # flights, trains, buses, cabs
    origin: str
    destination: str


class RouteValidationResponse(BaseModel):
    is_valid: bool
    is_same_location: bool
    message: str
    suggested_destinations: List[LocationOption] = Field(default_factory=list)


class LocationsResponse(BaseModel):
    airports: List[LocationOption] = Field(default_factory=list)
    hotel_cities: List[LocationOption] = Field(default_factory=list)
    train_stations: List[LocationOption] = Field(default_factory=list)
    bus_cities: List[LocationOption] = Field(default_factory=list)
    cab_cities: List[LocationOption] = Field(default_factory=list)
    package_destinations: List[LocationOption] = Field(default_factory=list)
