from typing import Dict, Any, Optional, Generic, TypeVar
from pydantic import BaseModel
from datetime import datetime, timezone

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: Optional[str] = None
    timestamp: datetime = datetime.now(timezone.utc)


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    timestamp: datetime
    database: str
    services: Dict[str, str]
