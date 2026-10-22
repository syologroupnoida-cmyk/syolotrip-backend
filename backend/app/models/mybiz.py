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
    Text,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, PrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.user import User
    from backend.app.models.booking import Booking


# ────────────────────────── Enums ──────────────────────────


class CompanySize(str, enum.Enum):
    SOLO = "1-10"
    SMALL = "11-50"
    MEDIUM = "51-200"
    LARGE = "201-500"
    ENTERPRISE = "500+"


class CompanyEmployeeRole(str, enum.Enum):
    ADMIN = "BIZ_ADMIN"
    MANAGER = "BIZ_MANAGER"
    EMPLOYEE = "BIZ_EMPLOYEE"


class CompanyEmployeeStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INVITED = "INVITED"
    DEACTIVATED = "DEACTIVATED"


class TripRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    BOOKED = "BOOKED"
    CANCELLED = "CANCELLED"


# ────────────────────────── Company ──────────────────────────


class Company(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    pan: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    employee_count_range: Mapped[str] = mapped_column(
        String(20), default=CompanySize.SOLO.value, nullable=False
    )
    billing_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pincode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Creator link
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Relationships
    employees: Mapped[List["CompanyEmployee"]] = relationship(
        "CompanyEmployee", back_populates="company", cascade="all, delete-orphan"
    )
    travel_policies: Mapped[List["TravelPolicy"]] = relationship(
        "TravelPolicy", back_populates="company", cascade="all, delete-orphan"
    )
    trip_requests: Mapped[List["TripRequest"]] = relationship(
        "TripRequest", back_populates="company", cascade="all, delete-orphan"
    )
    invoices: Mapped[List["CompanyInvoice"]] = relationship(
        "CompanyInvoice", back_populates="company", cascade="all, delete-orphan"
    )


# ────────────────────────── Company Employee ──────────────────────────


class CompanyEmployee(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "company_employees"

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(30), default=CompanyEmployeeRole.EMPLOYEE.value, nullable=False
    )
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default=CompanyEmployeeStatus.INVITED.value, nullable=False
    )

    company: Mapped["Company"] = relationship("Company", back_populates="employees")

    __table_args__ = (
        Index("idx_company_employee_unique", "company_id", "email", unique=True),
    )


# ────────────────────────── Travel Policy ──────────────────────────


class TravelPolicy(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "travel_policies"

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), default="Default Policy", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # JSON rules blob stores the full policy configuration:
    # {
    #   "flight_max_budget": 25000,
    #   "hotel_max_budget": 8000,
    #   "cab_max_budget": 3000,
    #   "bus_max_budget": 2000,
    #   "train_max_budget": 3000,
    #   "allowed_flight_classes": ["ECONOMY"],
    #   "allowed_hotel_stars": [3, 4],
    #   "advance_booking_days": 3,
    #   "requires_approval": true,
    #   "international_requires_approval": true
    # }
    rules: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)

    company: Mapped["Company"] = relationship("Company", back_populates="travel_policies")


# ────────────────────────── Trip Request ──────────────────────────


class TripRequest(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "trip_requests"

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    approver_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    service_type: Mapped[str] = mapped_column(String(30), nullable=False)
    trip_purpose: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    destination: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    travel_date_from: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    travel_date_to: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    estimated_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=TripRequestStatus.PENDING.value, nullable=False, index=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Linked booking after approval & actual booking
    booking_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True
    )

    company: Mapped["Company"] = relationship("Company", back_populates="trip_requests")


# ────────────────────────── Company Invoice ──────────────────────────


class CompanyInvoice(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "company_invoices"

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    invoice_number: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    gstin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    billing_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    base_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    tax_breakdown: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)

    company: Mapped["Company"] = relationship("Company", back_populates="invoices")
