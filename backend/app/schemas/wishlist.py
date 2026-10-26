import uuid
from typing import Optional, List
from pydantic import BaseModel, Field, computed_field


class WishlistItemCreate(BaseModel):
    id: str = Field(..., description="Unique item identifier / key")
    title: str = Field(..., min_length=1, max_length=255)
    category: str = Field(default="HOTEL", max_length=50)
    location: str = Field(default="", max_length=255)
    price: float = Field(default=0.0, ge=0)
    rating: Optional[float] = None
    image: str = Field(default="")
    badge: Optional[str] = None


class WishlistItemResponse(BaseModel):
    id: str
    title: str
    category: str
    location: str
    price: float
    rating: Optional[float] = None
    image: str
    badge: Optional[str] = None
    added_at: str

    @computed_field
    @property
    def addedAt(self) -> str:
        return self.added_at


class WishlistSyncRequest(BaseModel):
    items: List[WishlistItemCreate] = Field(default_factory=list)


class WishlistResponse(BaseModel):
    items: List[WishlistItemResponse]
    count: int
