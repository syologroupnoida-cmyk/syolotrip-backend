import uuid
import secrets
from typing import Optional, List, Tuple, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.user import User, UserRole
from backend.app.models.booking import (
    Booking,
    BookingItem,
    Passenger,
    BookingStatus,
    BookingServiceType,
)
from backend.app.models.travel import Flight, HotelRoom, Bus, HolidayPackage, Train, Cab
from backend.app.repositories.booking_repo import BookingRepository
from backend.app.repositories.travel_repo import TravelRepository
from backend.app.schemas.booking import (
    BookingCreateRequest,
    BookingCancelRequest,
    BookingResponse,
    BookingItemResponse,
    PassengerSchema,
    BookingStatusHistoryResponse,
)


def generate_booking_reference() -> str:
    """Generates an alphanumeric reference like 'SSJ-849201'."""
    suffix = ''.join(secrets.choice("23456789ABCDEFGHJKLMNPQRSTUVWXYZ") for _ in range(6))
    return f"SSJ-{suffix}"


class BookingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.booking_repo = BookingRepository(db)
        self.travel_repo = TravelRepository(db)

    def _map_booking_response(self, b: Booking) -> BookingResponse:
        passengers = []
        if b.passengers:
            for p in b.passengers:
                passengers.append(
                    PassengerSchema(
                        title=p.title,
                        first_name=p.first_name,
                        last_name=p.last_name,
                        passenger_type=p.passenger_type,
                        gender=p.gender,
                        date_of_birth=p.date_of_birth,
                        passport_number=p.passport_number,
                        seat_preference=p.seat_preference,
                    )
                )

        items = []
        if b.items:
            for item in b.items:
                items.append(
                    BookingItemResponse(
                        id=str(item.id),
                        item_type=item.item_type,
                        item_reference_id=item.item_reference_id,
                        title=item.title,
                        quantity=item.quantity,
                        unit_price=float(item.unit_price),
                        total_price=float(item.total_price),
                        meta_data=item.meta_data or {},
                    )
                )

        history = []
        if b.status_history:
            for h in b.status_history:
                history.append(
                    BookingStatusHistoryResponse(
                        from_status=h.from_status,
                        to_status=h.to_status,
                        reason=h.reason,
                        created_at=h.created_at.isoformat(),
                    )
                )

        return BookingResponse(
            id=str(b.id),
            booking_reference=b.booking_reference,
            user_id=str(b.user_id) if b.user_id else None,
            service_type=b.service_type,
            status=b.status,
            provider=b.provider,
            is_simulated=b.is_simulated,
            contact_email=b.contact_email,
            contact_phone=b.contact_phone,
            base_amount=float(b.base_amount),
            taxes_amount=float(b.taxes_amount),
            discount_amount=float(b.discount_amount),
            total_amount=float(b.total_amount),
            currency=b.currency,
            cancellation_reason=b.cancellation_reason,
            details_snapshot=b.details_snapshot or {},
            created_at=b.created_at.isoformat(),
            passengers=passengers,
            items=items,
            status_history=history,
        )

    async def create_booking(
        self,
        req: BookingCreateRequest,
        current_user: Optional[User] = None,
    ) -> BookingResponse:
        """Validates inventory, recalculates exact price on server, and creates booking."""
        if not req.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one booking item is required",
            )
        if not req.passengers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one traveler detail is required",
            )

        # Server-side price calculation
        calculated_base = 0.0
        calculated_taxes = 0.0
        booking_items_to_create: List[BookingItem] = []
        details_snapshot: Dict[str, Any] = {
            "items_summary": [],
            "insurance_selected": req.has_insurance,
            "promo_code": req.promo_code,
        }

        for item_req in req.items:
            try:
                ref_uuid = uuid.UUID(item_req.item_reference_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid item reference ID: {item_req.item_reference_id}",
                )

            item_type = item_req.item_type.upper()

            if item_type == "FLIGHT":
                flight = await self.travel_repo.get_flight_by_id(ref_uuid)
                if not flight or not flight.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Flight {item_req.item_reference_id} is no longer available",
                    )
                if flight.available_seats < item_req.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Only {flight.available_seats} seats remaining on flight {flight.flight_number}",
                    )
                unit_base = float(flight.base_fare)
                unit_tax = float(flight.taxes)
                item_total = (unit_base + unit_tax) * item_req.quantity
                calculated_base += unit_base * item_req.quantity
                calculated_taxes += unit_tax * item_req.quantity

                flight.available_seats -= item_req.quantity

                title = f"{flight.airline} ({flight.origin_code} ➔ {flight.destination_code})"
                booking_items_to_create.append(
                    BookingItem(
                        item_type=item_type,
                        item_reference_id=str(flight.id),
                        title=title,
                        quantity=item_req.quantity,
                        unit_price=unit_base + unit_tax,
                        total_price=item_total,
                        meta_data={
                            "airline": flight.airline,
                            "flight_number": flight.flight_number,
                            "origin": flight.origin_code,
                            "destination": flight.destination_code,
                            "departure_time": flight.departure_time,
                        },
                    )
                )
                details_snapshot["items_summary"].append({"title": title, "total": item_total})

            elif item_type == "HOTEL_ROOM":
                room = await self.travel_repo.get_hotel_room_by_id(ref_uuid)
                if not room or not room.is_available:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Hotel room {item_req.item_reference_id} is no longer available",
                    )
                if room.available_rooms < item_req.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Requested number of rooms is unavailable",
                    )
                nights = (item_req.meta_data or {}).get("nights", 1)
                unit_base = float(room.price_per_night) * nights
                unit_tax = float(room.taxes_per_night) * nights
                item_total = (unit_base + unit_tax) * item_req.quantity
                calculated_base += unit_base * item_req.quantity
                calculated_taxes += unit_tax * item_req.quantity

                room.available_rooms -= item_req.quantity

                title = f"{room.room_type} ({nights} nights)"
                booking_items_to_create.append(
                    BookingItem(
                        item_type=item_type,
                        item_reference_id=str(room.id),
                        title=title,
                        quantity=item_req.quantity,
                        unit_price=unit_base + unit_tax,
                        total_price=item_total,
                        meta_data={
                            "room_type": room.room_type,
                            "nights": nights,
                            "hotel_id": str(room.hotel_id),
                        },
                    )
                )
                details_snapshot["items_summary"].append({"title": title, "total": item_total})

            elif item_type == "BUS":
                bus = await self.travel_repo.get_bus_by_id(ref_uuid)
                if not bus or not bus.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Bus schedule not found",
                    )
                if bus.available_seats < item_req.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Requested number of bus seats is unavailable",
                    )
                unit_base = float(bus.base_fare)
                unit_tax = 0.0
                item_total = unit_base * item_req.quantity
                calculated_base += item_total
                bus.available_seats -= item_req.quantity

                title = f"{bus.operator_name} ({bus.from_city} ➔ {bus.to_city})"
                booking_items_to_create.append(
                    BookingItem(
                        item_type=item_type,
                        item_reference_id=str(bus.id),
                        title=title,
                        quantity=item_req.quantity,
                        unit_price=unit_base,
                        total_price=item_total,
                        meta_data={"operator": bus.operator_name},
                    )
                )
                details_snapshot["items_summary"].append({"title": title, "total": item_total})

            elif item_type == "PACKAGE":
                pkg = await self.travel_repo.get_package_by_id(ref_uuid)
                if not pkg or not pkg.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Holiday package not found",
                    )
                unit_base = float(pkg.price_per_person)
                item_total = unit_base * item_req.quantity
                calculated_base += item_total

                title = f"Holiday Package: {pkg.title}"
                booking_items_to_create.append(
                    BookingItem(
                        item_type=item_type,
                        item_reference_id=str(pkg.id),
                        title=title,
                        quantity=item_req.quantity,
                        unit_price=unit_base,
                        total_price=item_total,
                        meta_data={"title": pkg.title, "destination": pkg.destination},
                    )
                )
                details_snapshot["items_summary"].append({"title": title, "total": item_total})

            elif item_type == "TRAIN":
                train = await self.travel_repo.get_train_by_id(ref_uuid)
                if not train or not train.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Train schedule not found",
                    )
                if train.available_seats < item_req.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Requested number of train seats is unavailable",
                    )
                unit_base = float(train.base_fare)
                item_total = unit_base * item_req.quantity
                calculated_base += item_total
                train.available_seats -= item_req.quantity

                title = f"{train.train_name} ({train.train_number}) - {train.from_station_name} ➔ {train.to_station_name}"
                booking_items_to_create.append(
                    BookingItem(
                        item_type=item_type,
                        item_reference_id=str(train.id),
                        title=title,
                        quantity=item_req.quantity,
                        unit_price=unit_base,
                        total_price=item_total,
                        meta_data={
                            "train_number": train.train_number,
                            "train_name": train.train_name,
                            "train_class": train.train_class,
                            "departure_time": train.departure_time,
                        },
                    )
                )
                details_snapshot["items_summary"].append({"title": title, "total": item_total})

            elif item_type == "CAB":
                cab = await self.travel_repo.get_cab_by_id(ref_uuid)
                if not cab or not cab.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Cab option not found",
                    )
                unit_base = float(cab.base_fare)
                item_total = unit_base * item_req.quantity
                calculated_base += item_total

                title = f"{cab.cab_type} ({cab.vehicle_model}) - {cab.pickup_area} ➔ {cab.drop_area}"
                booking_items_to_create.append(
                    BookingItem(
                        item_type=item_type,
                        item_reference_id=str(cab.id),
                        title=title,
                        quantity=item_req.quantity,
                        unit_price=unit_base,
                        total_price=item_total,
                        meta_data={
                            "cab_type": cab.cab_type,
                            "vehicle_model": cab.vehicle_model,
                            "driver_name": cab.driver_name,
                            "driver_rating": cab.driver_rating,
                            "eta_minutes": cab.eta_minutes,
                        },
                    )
                )
                details_snapshot["items_summary"].append({"title": title, "total": item_total})
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported item type: {item_req.item_type}",
                )

        # Promo discounts
        discount = 0.0
        if req.promo_code:
            code = req.promo_code.upper().strip()
            if code in ["WANDERLUST", "SSJOURNEY", "WELCOME"]:
                discount = min(12500.0, calculated_base * 0.1)  # 10% up to 12500

        # Insurance fee
        insurance_fee = 3999.0 if req.has_insurance else 0.0
        if req.has_insurance:
            calculated_taxes += insurance_fee

        final_total = max(0.0, (calculated_base + calculated_taxes - discount))

        # Passengers
        passengers_to_create = [
            Passenger(
                title=p.title,
                first_name=p.first_name,
                last_name=p.last_name,
                passenger_type=p.passenger_type,
                gender=p.gender,
                date_of_birth=p.date_of_birth,
                passport_number=p.passport_number,
                seat_preference=p.seat_preference,
            )
            for p in req.passengers
        ]

        # Generate unique reference
        booking_ref = generate_booking_reference()

        # Build booking record
        booking = Booking(
            booking_reference=booking_ref,
            user_id=current_user.id if current_user else None,
            service_type=req.service_type.upper(),
            status=BookingStatus.PENDING.value,
            provider="SIMULATED_SS_JOURNEY",
            is_simulated=True,
            contact_email=req.contact_email.lower().strip(),
            contact_phone=req.contact_phone.strip(),
            base_amount=calculated_base,
            taxes_amount=calculated_taxes,
            discount_amount=discount,
            total_amount=final_total,
            currency="INR",
            details_snapshot=details_snapshot,
        )

        saved = await self.booking_repo.create_booking(
            booking=booking,
            items=booking_items_to_create,
            passengers=passengers_to_create,
        )
        return self._map_booking_response(saved)

    async def get_booking(
        self,
        booking_id_or_ref: str,
        current_user: Optional[User] = None,
    ) -> BookingResponse:
        """Retrieves booking with authorization checks."""
        # Check by UUID or by reference
        booking = None
        try:
            b_uuid = uuid.UUID(booking_id_or_ref)
            booking = await self.booking_repo.get_by_id(b_uuid)
        except ValueError:
            booking = await self.booking_repo.get_by_reference(booking_id_or_ref)

        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Authorization check:
        # 1. Admin can access any booking
        # 2. Owner user can access their booking
        # 3. Unauthenticated guest can access if they know the reference
        if current_user and current_user.role != UserRole.ADMIN.value:
            if booking.user_id and booking.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view this booking",
                )

        return self._map_booking_response(booking)

    async def get_my_trips(self, current_user: User) -> List[BookingResponse]:
        """Lists all bookings belonging to the authenticated customer."""
        bookings = await self.booking_repo.list_user_bookings(current_user.id)
        return [self._map_booking_response(b) for b in bookings]

    async def cancel_booking(
        self,
        booking_id_or_ref: str,
        req: BookingCancelRequest,
        current_user: Optional[User] = None,
    ) -> BookingResponse:
        """Cancels a booking if eligible and records the transition reason."""
        booking = None
        try:
            b_uuid = uuid.UUID(booking_id_or_ref)
            booking = await self.booking_repo.get_by_id(b_uuid)
        except ValueError:
            booking = await self.booking_repo.get_by_reference(booking_id_or_ref)

        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Permission check
        if current_user and current_user.role != UserRole.ADMIN.value:
            if booking.user_id and booking.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot cancel another customer's booking",
                )

        # Check eligibility
        if booking.status in [BookingStatus.CANCELLED.value, BookingStatus.REFUNDED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking is already cancelled",
            )

        updated = await self.booking_repo.update_status(
            booking=booking,
            new_status=BookingStatus.CANCELLED.value,
            reason=req.reason,
            changed_by_user_id=current_user.id if current_user else None,
        )
        return self._map_booking_response(updated)
