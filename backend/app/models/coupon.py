import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String,
    Integer,
    Numeric,
    Boolean,
    DateTime,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import Base, PrimaryKeyMixin, TimestampMixin


class Coupon(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "coupons"

    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    discount_type: Mapped[str] = mapped_column(String(20), default="FLAT", nullable=False)  # "PERCENTAGE" or "FLAT"
    discount_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    max_discount_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    min_order_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0, nullable=False)
    service_type: Mapped[str] = mapped_column(String(30), default="ALL", nullable=False)  # "FLIGHT", "HOTEL", "ALL", etc.
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    valid_from: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    usage_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    times_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        Index("idx_coupon_code_active", "code", "is_active"),
        Index("idx_coupon_service", "service_type", "is_active"),
    )
