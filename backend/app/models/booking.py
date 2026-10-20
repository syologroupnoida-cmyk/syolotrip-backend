import uuid
import enum
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Integer,
    Numeric,
    Boolean,
    ForeignKey,
    JSON,
    Index,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, PrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.user import User
    from backend.app.models.payment import Payment


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class BookingServiceType(str, enum.Enum):
    FLIGHT = "FLIGHT"
    HOTEL = "HOTEL"
    BUS = "BUS"
    PACKAGE = "PACKAGE"
    COMBO = "COMBO"


class Booking(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "bookings"

    booking_reference: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    service_type: Mapped[str] = mapped_column(
        String(30),
        default=BookingServiceType.FLIGHT.value,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default=BookingStatus.PENDING.value,
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(
        String(100),
        default="SIMULATED_SS_JOURNEY",
        nullable=False,
    )
    is_simulated: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    contact_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    contact_phone: Mapped[str] = mapped_column(String(50), nullable=False)

    base_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    taxes_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)

    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    details_snapshot: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="bookings")
    items: Mapped[List["BookingItem"]] = relationship(
        "BookingItem",
        back_populates="booking",
        cascade="all, delete-orphan",
    )
    passengers: Mapped[List["Passenger"]] = relationship(
        "Passenger",
        back_populates="booking",
        cascade="all, delete-orphan",
    )
    status_history: Mapped[List["BookingStatusHistory"]] = relationship(
        "BookingStatusHistory",
        back_populates="booking",
        cascade="all, delete-orphan",
        order_by="BookingStatusHistory.created_at",
    )
    payments: Mapped[List["Payment"]] = relationship(
        "Payment",
        back_populates="booking",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_booking_user_status", "user_id", "status"),
    )


class BookingItem(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "booking_items"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_type: Mapped[str] = mapped_column(String(50), nullable=False)  # FLIGHT, HOTEL_ROOM, BUS, PACKAGE
    item_reference_id: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    meta_data: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="items")


class Passenger(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "passengers"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(20), default="Mr", nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    passenger_type: Mapped[str] = mapped_column(String(20), default="ADULT", nullable=False)
    gender: Mapped[str] = mapped_column(String(20), default="MALE", nullable=False)

    date_of_birth: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    passport_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    seat_preference: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="passengers")


class BookingStatusHistory(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "booking_status_history"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_status: Mapped[str] = mapped_column(String(30), nullable=False)
    to_status: Mapped[str] = mapped_column(String(30), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    booking: Mapped["Booking"] = relationship("Booking", back_populates="status_history")
