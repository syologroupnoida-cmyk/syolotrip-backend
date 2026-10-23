import uuid
import enum
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Boolean,
    Numeric,
    Text,
    ForeignKey,
    DateTime,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, PrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.user import User
    from backend.app.models.travel import Hotel


class PartnerStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class PartnerBusinessType(str, enum.Enum):
    HOTELIER = "HOTELIER"
    HOMESTAY_HOST = "HOMESTAY_HOST"
    COMPANY = "COMPANY"


class PartnerProfile(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "partner_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    business_type: Mapped[str] = mapped_column(
        String(100),
        default=PartnerBusinessType.HOTELIER.value,
        nullable=False,
    )
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)
    tax_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # GSTIN, PAN

    status: Mapped[str] = mapped_column(
        String(30),
        default=PartnerStatus.PENDING.value,
        nullable=False,
        index=True,
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Configurable commercial model (kept initially inactive)
    commission_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    is_commission_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="partner_profile",
        foreign_keys=[user_id],
    )
    properties: Mapped[List["Hotel"]] = relationship(
        "Hotel",
        back_populates="partner",
        cascade="all, delete-orphan",
    )
