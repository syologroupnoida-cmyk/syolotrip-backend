from typing import Generic, TypeVar, Optional, List, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field

T = TypeVar("T")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: Optional[str] = None
    timestamp: str = Field(default_factory=utc_now_iso)


class PaginationMeta(BaseModel):
    total: int
    page: int
    limit: int
    pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    pagination: PaginationMeta
