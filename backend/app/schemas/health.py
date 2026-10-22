from typing import Dict
from pydantic import BaseModel, Field
from backend.app.schemas.common import ApiResponse, utc_now_iso


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    timestamp: str = Field(default_factory=utc_now_iso)
    database: str
    services: Dict[str, str]

