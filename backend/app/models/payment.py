import uuid
import enum
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Numeric,
    Boolean,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, PrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.booking import Booking


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, enum.Enum):
    CARD = "CARD"
    UPI = "UPI"
    APPLEPAY = "APPLEPAY"
    DEMO_SIMULATION = "DEMO_SIMULATION"
    RAZORPAY = "RAZORPAY"


class Payment(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payments"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    payment_reference: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    payment_method: Mapped[str] = mapped_column(
        String(50),
        default=PaymentMethod.DEMO_SIMULATION.value,
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    status: Mapped[str] = mapped_column(
        String(30),
        default=PaymentStatus.PENDING.value,
        nullable=False,
        index=True,
    )
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    gateway_response: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="payments")
