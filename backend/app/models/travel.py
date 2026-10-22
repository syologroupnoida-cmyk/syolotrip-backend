import uuid
from typing import List, Optional
from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    Numeric,
    Text,
    ForeignKey,
    JSON,
    Index,
    DateTime,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from backend.app.models.base import Base, PrimaryKeyMixin, TimestampMixin


class Flight(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "flights"

    airline: Mapped[str] = mapped_column(String(100), nullable=False)
    airline_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    flight_number: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    aircraft: Mapped[str] = mapped_column(String(100), nullable=False)

    origin_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    origin_name: Mapped[str] = mapped_column(String(200), nullable=False)
    origin_city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    origin_country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)

    destination_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    destination_name: Mapped[str] = mapped_column(String(200), nullable=False)
    destination_city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    destination_country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)

    departure_time: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. "08:30" or ISO
    arrival_time: Mapped[str] = mapped_column(String(50), nullable=False)    # e.g. "14:45+1" or ISO
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    stops: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stops_info: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    cabin_class: Mapped[str] = mapped_column(String(30), default="ECONOMY", nullable=False)
    available_seats: Mapped[int] = mapped_column(Integer, default=50, nullable=False)

    base_fare: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    taxes: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)

    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    baggage_info: Mapped[Optional[str]] = mapped_column(String(100), default="2 × 23kg checked", nullable=True)
    emissions_kg: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    emissions_rating: Mapped[Optional[str]] = mapped_column(String(20), default="low", nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)

    __table_args__ = (
        Index("idx_flight_search", "origin_code", "destination_code", "is_active"),
        Index("idx_flight_cities", "origin_city", "destination_city"),
    )


class Hotel(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "hotels"

    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    star_rating: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    guest_rating: Mapped[float] = mapped_column(Float, default=8.8, nullable=False)
    rating_label: Mapped[str] = mapped_column(String(50), default="Excellent", nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, default=100, nullable=False)

    address: Mapped[str] = mapped_column(String(300), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)
    neighborhood: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    overview: Mapped[str] = mapped_column(Text, nullable=False)
    amenities: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    featured_image: Mapped[str] = mapped_column(String(500), nullable=False)
    images: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)

    starting_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)

    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    rooms: Mapped[List["HotelRoom"]] = relationship(
        "HotelRoom",
        back_populates="hotel",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_hotel_search", "city", "star_rating", "is_active"),
    )


class HotelRoom(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "hotel_rooms"

    hotel_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("hotels.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    room_type: Mapped[str] = mapped_column(String(150), nullable=False)
    bed_type: Mapped[str] = mapped_column(String(100), default="King Bed", nullable=False)
    max_occupancy: Mapped[int] = mapped_column(Integer, default=2, nullable=False)

    price_per_night: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    taxes_per_night: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    available_rooms: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    amenities: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    images: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    hotel: Mapped["Hotel"] = relationship("Hotel", back_populates="rooms")


class Bus(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "buses"

    operator_name: Mapped[str] = mapped_column(String(150), nullable=False)
    bus_type: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Volvo Multi-Axle AC Sleeper"

    from_city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    to_city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    boarding_point: Mapped[str] = mapped_column(String(200), nullable=False)
    dropping_point: Mapped[str] = mapped_column(String(200), nullable=False)

    departure_time: Mapped[str] = mapped_column(String(50), nullable=False)
    arrival_time: Mapped[str] = mapped_column(String(50), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    available_seats: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    base_fare: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    rating: Mapped[float] = mapped_column(Float, default=4.5, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)

    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("idx_bus_search", "from_city", "to_city", "is_active"),
    )


class HolidayPackage(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "holiday_packages"

    title: Mapped[str] = mapped_column(String(250), nullable=False, index=True)
    destination: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_nights: Mapped[int] = mapped_column(Integer, nullable=False)

    overview: Mapped[str] = mapped_column(Text, nullable=False)
    inclusions: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    exclusions: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    itinerary: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)

    price_per_person: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    featured_image: Mapped[str] = mapped_column(String(500), nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=4.8, nullable=False)
    available_capacity: Mapped[int] = mapped_column(Integer, default=20, nullable=False)

    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("idx_package_search", "destination", "is_active"),
    )


class Train(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "trains"

    train_number: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    train_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    train_type: Mapped[str] = mapped_column(String(100), default="Superfast Express", nullable=False)

    from_station_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    from_station_name: Mapped[str] = mapped_column(String(150), nullable=False)
    from_city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    to_station_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    to_station_name: Mapped[str] = mapped_column(String(150), nullable=False)
    to_city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    departure_time: Mapped[str] = mapped_column(String(50), nullable=False)
    arrival_time: Mapped[str] = mapped_column(String(50), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    train_class: Mapped[str] = mapped_column(String(50), default="AC Chair Car (CC)", nullable=False)
    available_seats: Mapped[int] = mapped_column(Integer, default=120, nullable=False)
    base_fare: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    rating: Mapped[float] = mapped_column(Float, default=4.8, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)

    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("idx_train_search", "from_city", "to_city", "is_active"),
        Index("idx_train_stations", "from_station_code", "to_station_code"),
    )


class Cab(Base, PrimaryKeyMixin, TimestampMixin):
    __tablename__ = "cabs"

    cab_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # Sedan, SUV, Luxury, Hatchback
    vehicle_model: Mapped[str] = mapped_column(String(150), nullable=False)        # Toyota Innova, Honda City
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    pickup_area: Mapped[str] = mapped_column(String(200), nullable=False)
    drop_area: Mapped[str] = mapped_column(String(200), nullable=False)

    driver_name: Mapped[str] = mapped_column(String(150), default="Verified Chauffeur", nullable=False)
    driver_rating: Mapped[float] = mapped_column(Float, default=4.9, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    base_fare: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    eta_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    features: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)

    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("idx_cab_search", "city", "cab_type", "is_active"),
    )
