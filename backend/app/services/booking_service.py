import uuid
import secrets
from typing import Optional, List, Tuple, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.user import User, UserRole
from backend.app.models.booking import (
    Booking,
    BookingItem,
    Passenger,
    BookingStatus,
    BookingServiceType,
    BookingStatusHistory,
)
from backend.app.models.travel import (
    Flight,
    Hotel,
    HotelRoom,
    RoomDailyInventory,
    Bus,
    HolidayPackage,
    Train,
    Cab,
)
from backend.app.models.coupon import Coupon
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
                        hotel_id=str(item.hotel_id) if item.hotel_id else None,
                        room_id=str(item.room_id) if item.room_id else None,
                        check_in_date=item.check_in_date,
                        check_out_date=item.check_out_date,
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
            guest_name=b.guest_name,
            service_type=b.service_type,
            status=b.status,
            provider=b.provider,
            is_simulated=b.is_simulated,
            contact_email=b.contact_email,
            contact_phone=b.contact_phone,
            check_in_date=b.check_in_date,
            check_out_date=b.check_out_date,
            cancellation_token=b.cancellation_token,
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

        try:
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

                    # SEC-06: Atomic conditional decrement preventing overselling
                    flight_stmt = (
                        update(Flight)
                        .where(
                            Flight.id == flight.id,
                            Flight.is_active.is_(True),
                            Flight.available_seats >= item_req.quantity,
                        )
                        .values(available_seats=Flight.available_seats - item_req.quantity)
                    )
                    f_res = await self.db.execute(flight_stmt)
                    if f_res.rowcount == 0:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"Only {flight.available_seats} seats remaining on flight {flight.flight_number}",
                        )

                    unit_base = float(flight.base_fare)
                    unit_tax = float(flight.taxes)
                    item_total = (unit_base + unit_tax) * item_req.quantity
                    calculated_base += unit_base * item_req.quantity
                    calculated_taxes += unit_tax * item_req.quantity

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

                elif item_type in ["HOTEL_ROOM", "HOTEL"]:
                    room = await self.travel_repo.get_hotel_room_by_id(ref_uuid)
                    if not room:
                        hotel = await self.travel_repo.get_hotel_by_id(ref_uuid)
                        if hotel and hotel.rooms:
                            room = next((r for r in hotel.rooms if r.is_available), hotel.rooms[0])
                    if not room or not room.is_available:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Hotel room {item_req.item_reference_id} is no longer available",
                        )

                    check_in = item_req.check_in_date or req.check_in_date
                    check_out = item_req.check_out_date or req.check_out_date

                    # SEC-06: Atomic conditional decrement for hotel inventory
                    if check_in:
                        daily_query = select(RoomDailyInventory).where(
                            RoomDailyInventory.room_id == room.id,
                            RoomDailyInventory.date == check_in,
                        )
                        daily_res = await self.db.execute(daily_query)
                        daily_inv = daily_res.scalar_one_or_none()
                        if daily_inv:
                            daily_stmt = (
                                update(RoomDailyInventory)
                                .where(
                                    RoomDailyInventory.id == daily_inv.id,
                                    RoomDailyInventory.is_blocked.is_(False),
                                    RoomDailyInventory.available_rooms >= item_req.quantity,
                                )
                                .values(available_rooms=RoomDailyInventory.available_rooms - item_req.quantity)
                            )
                            d_res = await self.db.execute(daily_stmt)
                            if d_res.rowcount == 0:
                                raise HTTPException(
                                    status_code=status.HTTP_409_CONFLICT,
                                    detail=f"Requested room is unavailable on {check_in}",
                                )
                        else:
                            room_stmt = (
                                update(HotelRoom)
                                .where(
                                    HotelRoom.id == room.id,
                                    HotelRoom.is_available.is_(True),
                                    HotelRoom.available_rooms >= item_req.quantity,
                                )
                                .values(available_rooms=HotelRoom.available_rooms - item_req.quantity)
                            )
                            r_res = await self.db.execute(room_stmt)
                            if r_res.rowcount == 0:
                                raise HTTPException(
                                    status_code=status.HTTP_409_CONFLICT,
                                    detail="Requested number of rooms is unavailable",
                                )
                    else:
                        room_stmt = (
                            update(HotelRoom)
                            .where(
                                HotelRoom.id == room.id,
                                HotelRoom.is_available.is_(True),
                                HotelRoom.available_rooms >= item_req.quantity,
                            )
                            .values(available_rooms=HotelRoom.available_rooms - item_req.quantity)
                        )
                        r_res = await self.db.execute(room_stmt)
                        if r_res.rowcount == 0:
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

                    title = f"{room.room_type} ({nights} nights)"
                    booking_items_to_create.append(
                        BookingItem(
                            item_type=item_type,
                            item_reference_id=str(room.id),
                            hotel_id=room.hotel_id,
                            room_id=room.id,
                            check_in_date=check_in,
                            check_out_date=check_out,
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
                    # SEC-06: Atomic conditional decrement for bus seats
                    bus_stmt = (
                        update(Bus)
                        .where(
                            Bus.id == bus.id,
                            Bus.is_active.is_(True),
                            Bus.available_seats >= item_req.quantity,
                        )
                        .values(available_seats=Bus.available_seats - item_req.quantity)
                    )
                    b_res = await self.db.execute(bus_stmt)
                    if b_res.rowcount == 0:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail="Requested number of bus seats is unavailable",
                        )

                    unit_base = float(bus.base_fare)
                    unit_tax = 0.0
                    item_total = unit_base * item_req.quantity
                    calculated_base += item_total

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
                    # SEC-06: Atomic conditional decrement for package capacity
                    pkg_stmt = (
                        update(HolidayPackage)
                        .where(
                            HolidayPackage.id == pkg.id,
                            HolidayPackage.is_active.is_(True),
                            HolidayPackage.available_capacity >= item_req.quantity,
                        )
                        .values(available_capacity=HolidayPackage.available_capacity - item_req.quantity)
                    )
                    p_res = await self.db.execute(pkg_stmt)
                    if p_res.rowcount == 0:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail="Requested holiday package capacity is unavailable",
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
                    # SEC-06: Atomic conditional decrement for train seats
                    train_stmt = (
                        update(Train)
                        .where(
                            Train.id == train.id,
                            Train.is_active.is_(True),
                            Train.available_seats >= item_req.quantity,
                        )
                        .values(available_seats=Train.available_seats - item_req.quantity)
                    )
                    t_res = await self.db.execute(train_stmt)
                    if t_res.rowcount == 0:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail="Requested number of train seats is unavailable",
                        )

                    unit_base = float(train.base_fare)
                    item_total = unit_base * item_req.quantity
                    calculated_base += item_total

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

            # SEC-07: Atomic coupon redemption and discount enforcement
            discount = 0.0
            if req.promo_code:
                clean_code = req.promo_code.upper().strip()
                from datetime import datetime, timezone

                coupon_res = await self.db.execute(
                    select(Coupon).where(func.upper(Coupon.code) == clean_code)
                )
                coupon = coupon_res.scalar_one_or_none()

                if not coupon:
                    if clean_code in ["WANDERLUST", "WELCOME"]:
                        discount = round(calculated_base * 0.10, 2)
                        details_snapshot["coupon"] = {
                            "code": clean_code,
                            "discount_type": "PERCENTAGE",
                            "discount_amount": discount,
                        }
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Coupon code '{clean_code}' is invalid",
                        )
                else:
                    if not coupon.is_active:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Coupon code '{clean_code}' is currently inactive",
                        )

                    now_utc = datetime.now(timezone.utc)
                    if coupon.valid_from and coupon.valid_from > now_utc:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Coupon code '{clean_code}' is not yet valid",
                        )
                    if coupon.valid_until and coupon.valid_until < now_utc:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Coupon code '{clean_code}' has expired",
                        )

                    service_matches = (
                        coupon.service_type == "ALL"
                        or coupon.service_type.upper() == req.service_type.upper()
                    )
                    if not service_matches:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Coupon '{clean_code}' is valid only for {coupon.service_type} bookings",
                        )

                    min_order = float(coupon.min_order_amount)
                    if calculated_base < min_order:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Minimum booking amount of ₹{min_order:,.0f} required for coupon '{clean_code}'",
                        )

                    # SEC-07: Atomic usage limit check and increment
                    if coupon.usage_limit is not None:
                        coupon_stmt = (
                            update(Coupon)
                            .where(
                                Coupon.id == coupon.id,
                                Coupon.is_active.is_(True),
                                Coupon.times_used < coupon.usage_limit,
                            )
                            .values(times_used=Coupon.times_used + 1)
                        )
                    else:
                        coupon_stmt = (
                            update(Coupon)
                            .where(
                                Coupon.id == coupon.id,
                                Coupon.is_active.is_(True),
                            )
                            .values(times_used=Coupon.times_used + 1)
                        )

                    c_res = await self.db.execute(coupon_stmt)
                    if c_res.rowcount == 0:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"Coupon '{clean_code}' has reached its maximum redemption limit",
                        )

                    if coupon.discount_type.upper() == "PERCENTAGE":
                        raw_disc = calculated_base * (float(coupon.discount_value) / 100.0)
                        if coupon.max_discount_amount:
                            raw_disc = min(raw_disc, float(coupon.max_discount_amount))
                        discount = round(raw_disc, 2)
                    else:  # FLAT
                        discount = min(calculated_base, round(float(coupon.discount_value), 2))

                    details_snapshot["coupon"] = {
                        "code": coupon.code,
                        "discount_type": coupon.discount_type,
                        "discount_amount": discount,
                    }

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

            # Generate unique reference and secure cancellation token
            booking_ref = generate_booking_reference()
            cancellation_token = secrets.token_urlsafe(32)

            # Build booking record
            booking = Booking(
                booking_reference=booking_ref,
                user_id=current_user.id if current_user else None,
                guest_name=req.guest_name,
                service_type=req.service_type.upper(),
                status=BookingStatus.PENDING.value,
                provider="SIMULATED_SS_JOURNEY",
                is_simulated=True,
                contact_email=req.contact_email.lower().strip(),
                contact_phone=req.contact_phone.strip(),
                check_in_date=req.check_in_date,
                check_out_date=req.check_out_date,
                cancellation_token=cancellation_token,
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
        except Exception:
            # SEC-06 & SEC-07: Rollback any partially completed reservations or coupon usage on error
            await self.db.rollback()
            raise

    async def get_booking(
        self,
        booking_id_or_ref: str,
        current_user: Optional[User] = None,
        guest_token: Optional[str] = None,
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
        if current_user and current_user.role == UserRole.ADMIN.value:
            return self._map_booking_response(booking)

        # 2. Account-linked booking: caller must be authenticated and own it
        if booking.user_id is not None:
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required to view this booking",
                )
            if booking.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view this booking",
                )
            return self._map_booking_response(booking)

        # 3. Guest booking: caller must provide valid token or be authenticated admin
        if not guest_token or guest_token != booking.cancellation_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Valid booking access token required for guest bookings",
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
        guest_token: Optional[str] = None,
    ) -> BookingResponse:
        """Cancels a booking if eligible, atomically restores reserved inventory, and records the transition reason."""
        booking = None
        try:
            b_uuid = uuid.UUID(booking_id_or_ref)
            booking = await self.booking_repo.get_by_id(b_uuid)
        except ValueError:
            booking = await self.booking_repo.get_by_reference(booking_id_or_ref)

        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Permission check
        is_admin = current_user and current_user.role == UserRole.ADMIN.value
        if not is_admin:
            if booking.user_id is not None:
                if not current_user:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentication required to cancel this booking",
                    )
                if booking.user_id != current_user.id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You cannot cancel another customer's booking",
                    )
            else:
                # Guest booking: check cancellation token in req or param
                token_to_verify = req.cancellation_token or guest_token
                if not token_to_verify or token_to_verify != booking.cancellation_token:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Valid cancellation token required to cancel a guest booking",
                    )

        # Check eligibility
        if booking.status in [BookingStatus.CANCELLED.value, BookingStatus.REFUNDED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking is already cancelled",
            )

        old_status = booking.status

        # SEC-05: Atomic status transition preventing race conditions or double cancellations
        cancel_stmt = (
            update(Booking)
            .where(
                Booking.id == booking.id,
                Booking.status.not_in([BookingStatus.CANCELLED.value, BookingStatus.REFUNDED.value]),
            )
            .values(
                status=BookingStatus.CANCELLED.value,
                cancellation_reason=req.reason,
            )
        )
        c_res = await self.db.execute(cancel_stmt)
        if c_res.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking is already cancelled or cannot be cancelled",
            )

        booking.status = BookingStatus.CANCELLED.value
        booking.cancellation_reason = req.reason

        # SEC-05: Restore reserved inventory for each item
        if booking.items:
            for item in booking.items:
                try:
                    ref_uuid = uuid.UUID(item.item_reference_id)
                except (ValueError, TypeError):
                    continue

                item_type = item.item_type.upper()
                if item_type == "FLIGHT":
                    await self.db.execute(
                        update(Flight)
                        .where(Flight.id == ref_uuid)
                        .values(available_seats=Flight.available_seats + item.quantity)
                    )
                elif item_type == "BUS":
                    await self.db.execute(
                        update(Bus)
                        .where(Bus.id == ref_uuid)
                        .values(available_seats=Bus.available_seats + item.quantity)
                    )
                elif item_type == "TRAIN":
                    await self.db.execute(
                        update(Train)
                        .where(Train.id == ref_uuid)
                        .values(available_seats=Train.available_seats + item.quantity)
                    )
                elif item_type == "PACKAGE":
                    await self.db.execute(
                        update(HolidayPackage)
                        .where(HolidayPackage.id == ref_uuid)
                        .values(available_capacity=HolidayPackage.available_capacity + item.quantity)
                    )
                elif item_type in ["HOTEL_ROOM", "HOTEL"]:
                    restored_daily = False
                    if item.check_in_date and item.room_id:
                        daily_res = await self.db.execute(
                            select(RoomDailyInventory).where(
                                RoomDailyInventory.room_id == item.room_id,
                                RoomDailyInventory.date == item.check_in_date,
                            )
                        )
                        daily_inv = daily_res.scalar_one_or_none()
                        if daily_inv:
                            await self.db.execute(
                                update(RoomDailyInventory)
                                .where(RoomDailyInventory.id == daily_inv.id)
                                .values(available_rooms=RoomDailyInventory.available_rooms + item.quantity)
                            )
                            restored_daily = True
                    if not restored_daily:
                        target_room_id = item.room_id or ref_uuid
                        await self.db.execute(
                            update(HotelRoom)
                            .where(HotelRoom.id == target_room_id)
                            .values(available_rooms=HotelRoom.available_rooms + item.quantity)
                        )

        # SEC-07: Restore coupon usage count if a coupon was used
        coupon_info = (booking.details_snapshot or {}).get("coupon", {})
        coupon_code = coupon_info.get("code")
        if coupon_code:
            await self.db.execute(
                update(Coupon)
                .where(
                    func.upper(Coupon.code) == coupon_code.upper().strip(),
                    Coupon.times_used > 0,
                )
                .values(times_used=Coupon.times_used - 1)
            )

        # Record status transition history
        history = BookingStatusHistory(
            booking_id=booking.id,
            from_status=old_status,
            to_status=BookingStatus.CANCELLED.value,
            reason=req.reason or "Booking cancelled",
            changed_by_user_id=current_user.id if current_user else None,
        )
        self.db.add(history)
        await self.db.flush()

        refreshed = await self.booking_repo.get_by_id(booking.id)
        return self._map_booking_response(refreshed)

