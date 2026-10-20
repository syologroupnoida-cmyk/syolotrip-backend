from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    total_users: int
    total_bookings: int
    total_revenue: float
    confirmed_bookings: int
    pending_bookings: int
    cancelled_bookings: int
    total_flights: int
    total_hotels: int
    total_buses: int
    total_packages: int
    adapter_mode: str = "MOCK_DETERMINISTIC"


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: str

    model_config = {"from_attributes": True}
