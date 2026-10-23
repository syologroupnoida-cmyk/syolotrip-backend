from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CouponValidateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    service_type: Optional[str] = "ALL"
    order_amount: float = Field(..., ge=0)


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_amount: float
    final_amount: float
    discount_type: str
    discount_value: float
    message: str


class CouponCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    discount_type: str = Field("FLAT", description="FLAT or PERCENTAGE")
    discount_value: float = Field(..., gt=0)
    max_discount_amount: Optional[float] = None
    min_order_amount: float = Field(0.0, ge=0)
    service_type: str = "ALL"
    description: Optional[str] = None
    is_active: bool = True


class CouponUpdateRequest(BaseModel):
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    max_discount_amount: Optional[float] = None
    min_order_amount: Optional[float] = None
    service_type: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CouponResponse(BaseModel):
    id: str
    code: str
    discount_type: str
    discount_value: float
    max_discount_amount: Optional[float] = None
    min_order_amount: float
    service_type: str
    description: Optional[str] = None
    is_active: bool
    times_used: int
    created_at: str

    model_config = {"from_attributes": True}
