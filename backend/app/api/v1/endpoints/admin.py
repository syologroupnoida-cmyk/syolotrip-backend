import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.booking import Booking
from backend.app.models.audit import AuditLog
from backend.app.models.coupon import Coupon
from backend.app.models.travel import Flight, Hotel, HotelRoom, Bus, Train, Cab, HolidayPackage
from backend.app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from backend.app.schemas.admin import DashboardStatsResponse
from backend.app.schemas.booking import BookingResponse
from backend.app.schemas.flight import FlightCreate, FlightResponse
from backend.app.schemas.hotel import HotelCreate, HotelResponse
from backend.app.schemas.coupon import CouponCreateRequest, CouponUpdateRequest, CouponResponse
from backend.app.services.admin_service import AdminService
from backend.app.services.travel_service import TravelService
from backend.app.api.v1.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Operations"])


@router.get("/overview", response_model=ApiResponse[DashboardStatsResponse])
async def get_admin_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    stats = await service.get_dashboard_metrics()
    return ApiResponse(success=True, data=stats)


@router.get("/bookings", response_model=ApiResponse[PaginatedResponse[BookingResponse]])
async def list_admin_bookings(
    status: Optional[str] = Query(None, description="Filter by status: PENDING, CONFIRMED, CANCELLED, FAILED"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    bookings, total = await service.list_bookings(status=status, page=page, limit=limit)
    pages = (total + limit - 1) // limit if total > 0 else 1

    return ApiResponse(
        success=True,
        data=PaginatedResponse(
            items=bookings,
            pagination=PaginationMeta(total=total, page=page, limit=limit, pages=pages),
        ),
    )


@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status_update: dict,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    try:
        bid = uuid.UUID(booking_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid booking ID format")

    res = await db.execute(select(Booking).where(Booking.id == bid))
    booking = res.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    new_status = status_update.get("status")
    if new_status:
        old_status = booking.status
        booking.status = new_status
        await service.record_audit(
            action=f"UPDATE_BOOKING_STATUS_{new_status}",
            entity_type="BOOKING",
            entity_id=str(booking.id),
            user_id=current_admin.id,
            details={"previous": old_status, "new": new_status},
        )
        await db.commit()
    return ApiResponse(success=True, message=f"Booking status updated to {new_status}")


@router.get("/users")
async def list_admin_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    res = await db.execute(select(User).order_by(User.created_at.desc()).offset(offset).limit(limit))
    users = res.scalars().all()
    count_res = await db.execute(select(func.count(User.id)))
    total = count_res.scalar_one()

    return ApiResponse(
        success=True,
        data={
            "items": [
                {
                    "id": str(u.id),
                    "email": u.email,
                    "full_name": u.full_name,
                    "phone": u.phone,
                    "role": u.role,
                    "is_active": u.is_active,
                    "created_at": u.created_at.isoformat() if u.created_at else "",
                }
                for u in users
            ],
            "total": total,
        },
    )


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    payload: Dict[str, Any],
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    if uid == current_admin.id:
        raise HTTPException(status_code=400, detail="Administrators cannot deactivate their own account")

    res = await db.execute(select(User).where(User.id == uid))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_active = payload.get("is_active")
    if is_active is not None:
        user.is_active = bool(is_active)
        admin_service = AdminService(db)
        await admin_service.record_audit(
            action=f"UPDATE_USER_STATUS_{'ACTIVE' if user.is_active else 'INACTIVE'}",
            entity_type="USER",
            entity_id=str(user.id),
            user_id=current_admin.id,
            details={"email": user.email, "is_active": user.is_active},
        )
        await db.commit()

    return ApiResponse(
        success=True,
        data={"id": str(user.id), "is_active": user.is_active},
        message=f"User status updated to {'Active' if user.is_active else 'Inactive'}",
    )


@router.get("/audit-logs")
async def list_admin_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    logs = res.scalars().all()
    return ApiResponse(
        success=True,
        data=[
            {
                "id": str(l.id),
                "user_id": str(l.user_id) if l.user_id else None,
                "action": l.action,
                "entity_type": l.entity_type,
                "entity_id": l.entity_id,
                "details": l.details,
                "created_at": l.created_at.isoformat() if l.created_at else "",
            }
            for l in logs
        ],
    )


@router.get("/coupons", response_model=ApiResponse[List[CouponResponse]])
async def list_admin_coupons(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Coupon).order_by(Coupon.created_at.desc())
    res = await db.execute(query)
    coupons = res.scalars().all()
    return ApiResponse(
        success=True,
        data=[
            CouponResponse(
                id=str(c.id),
                code=c.code,
                discount_type=c.discount_type,
                discount_value=float(c.discount_value),
                max_discount_amount=float(c.max_discount_amount) if c.max_discount_amount else None,
                min_order_amount=float(c.min_order_amount),
                service_type=c.service_type,
                description=c.description,
                is_active=c.is_active,
                times_used=c.times_used,
                created_at=c.created_at.isoformat() if c.created_at else "",
            )
            for c in coupons
        ],
    )


@router.post("/coupons", response_model=ApiResponse[CouponResponse], status_code=status.HTTP_201_CREATED)
async def create_admin_coupon(
    req: CouponCreateRequest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    clean_code = req.code.strip().upper()
    existing_res = await db.execute(select(Coupon).where(func.upper(Coupon.code) == clean_code))
    if existing_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Coupon code '{clean_code}' already exists")

    coupon = Coupon(
        code=clean_code,
        discount_type=req.discount_type.upper(),
        discount_value=req.discount_value,
        max_discount_amount=req.max_discount_amount,
        min_order_amount=req.min_order_amount,
        service_type=req.service_type.upper(),
        description=req.description,
        is_active=req.is_active,
    )
    db.add(coupon)
    admin_service = AdminService(db)
    await admin_service.record_audit(
        action="CREATE_COUPON",
        entity_type="COUPON",
        entity_id=clean_code,
        user_id=current_admin.id,
        details={"code": clean_code, "discount_type": coupon.discount_type, "value": float(coupon.discount_value)},
    )
    await db.commit()
    await db.refresh(coupon)
    return ApiResponse(
        success=True,
        data=CouponResponse(
            id=str(coupon.id),
            code=coupon.code,
            discount_type=coupon.discount_type,
            discount_value=float(coupon.discount_value),
            max_discount_amount=float(coupon.max_discount_amount) if coupon.max_discount_amount else None,
            min_order_amount=float(coupon.min_order_amount),
            service_type=coupon.service_type,
            description=coupon.description,
            is_active=coupon.is_active,
            times_used=coupon.times_used,
            created_at=coupon.created_at.isoformat() if coupon.created_at else "",
        ),
        message=f"Coupon '{coupon.code}' created successfully",
    )


@router.patch("/coupons/{coupon_id}", response_model=ApiResponse[CouponResponse])
async def update_admin_coupon(
    coupon_id: str,
    req: CouponUpdateRequest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        cid = uuid.UUID(coupon_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid coupon ID format")

    res = await db.execute(select(Coupon).where(Coupon.id == cid))
    coupon = res.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    if req.discount_type is not None:
        coupon.discount_type = req.discount_type.upper()
    if req.discount_value is not None:
        coupon.discount_value = req.discount_value
    if req.max_discount_amount is not None:
        coupon.max_discount_amount = req.max_discount_amount
    if req.min_order_amount is not None:
        coupon.min_order_amount = req.min_order_amount
    if req.service_type is not None:
        coupon.service_type = req.service_type.upper()
    if req.description is not None:
        coupon.description = req.description
    if req.is_active is not None:
        coupon.is_active = req.is_active

    admin_service = AdminService(db)
    await admin_service.record_audit(
        action="UPDATE_COUPON",
        entity_type="COUPON",
        entity_id=str(coupon.id),
        user_id=current_admin.id,
        details={"code": coupon.code, "is_active": coupon.is_active},
    )
    await db.commit()
    await db.refresh(coupon)
    return ApiResponse(
        success=True,
        data=CouponResponse(
            id=str(coupon.id),
            code=coupon.code,
            discount_type=coupon.discount_type,
            discount_value=float(coupon.discount_value),
            max_discount_amount=float(coupon.max_discount_amount) if coupon.max_discount_amount else None,
            min_order_amount=float(coupon.min_order_amount),
            service_type=coupon.service_type,
            description=coupon.description,
            is_active=coupon.is_active,
            times_used=coupon.times_used,
            created_at=coupon.created_at.isoformat() if coupon.created_at else "",
        ),
        message=f"Coupon '{coupon.code}' updated successfully",
    )


@router.delete("/coupons/{coupon_id}")
async def delete_admin_coupon(
    coupon_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        cid = uuid.UUID(coupon_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid coupon ID format")

    res = await db.execute(select(Coupon).where(Coupon.id == cid))
    coupon = res.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    code = coupon.code
    await db.delete(coupon)
    admin_service = AdminService(db)
    await admin_service.record_audit(
        action="DELETE_COUPON",
        entity_type="COUPON",
        entity_id=str(cid),
        user_id=current_admin.id,
        details={"code": code},
    )
    return ApiResponse(
        success=True,
        data={"deleted_id": str(cid), "code": code},
        message=f"Coupon '{code}' deleted successfully",
    )


@router.post("/flights", response_model=ApiResponse[FlightResponse], status_code=status.HTTP_201_CREATED)
async def create_flight_listing(
    req: FlightCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = TravelService(db)
    admin_service = AdminService(db)
    flight = Flight(
        airline=req.airline,
        airline_code=req.airline_code,
        flight_number=req.flight_number,
        aircraft=req.aircraft,
        origin_code=req.origin_code,
        origin_name=req.origin_name,
        origin_city=req.origin_city,
        origin_country=req.origin_country,
        destination_code=req.destination_code,
        destination_name=req.destination_name,
        destination_city=req.destination_city,
        destination_country=req.destination_country,
        departure_time=req.departure_time,
        arrival_time=req.arrival_time,
        duration_minutes=req.duration_minutes,
        stops=req.stops,
        stops_info=req.stops_info,
        cabin_class=req.cabin_class,
        available_seats=req.available_seats,
        base_fare=req.base_fare,
        taxes=req.taxes,
        total_price=req.total_price,
        currency=req.currency,
        logo_url=req.logo_url,
        baggage_info=req.baggage_info,
        emissions_kg=req.emissions_kg,
        tags=req.tags or [],
        is_simulated=True,
        is_active=True,
    )
    saved = await service.travel_repo.create_flight(flight)
    await admin_service.record_audit(
        action="CREATE_FLIGHT",
        entity_type="FLIGHT",
        entity_id=str(saved.id),
        user_id=current_admin.id,
        details={"flight_number": saved.flight_number},
    )
    await db.commit()
    return ApiResponse(
        success=True,
        data=service._map_flight(saved),
        message="Flight listing created successfully",
    )


@router.post("/trains", status_code=status.HTTP_201_CREATED)
async def create_train_listing(
    payload: dict,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    admin_service = AdminService(db)
    train = Train(
        train_number=payload.get("train_number", "20188"),
        train_name=payload.get("train_name", "Vande Bharat Special"),
        train_type=payload.get("train_type", "Superfast Express"),
        from_station_code=payload.get("from_station_code", "NDLS"),
        from_station_name=payload.get("from_station_name", "New Delhi Railway Station"),
        from_city=payload.get("from_city", "Delhi"),
        to_station_code=payload.get("to_station_code", "MMCT"),
        to_station_name=payload.get("to_station_name", "Mumbai Central"),
        to_city=payload.get("to_city", "Mumbai"),
        departure_time=payload.get("departure_time", "06:00"),
        arrival_time=payload.get("arrival_time", "14:15"),
        duration_minutes=int(payload.get("duration_minutes", 495)),
        train_class=payload.get("train_class", "AC Chair Car (CC)"),
        available_seats=int(payload.get("available_seats", 80)),
        base_fare=float(payload.get("base_fare", 1750)),
        currency=payload.get("currency", "INR"),
        is_simulated=True,
        is_active=True,
    )
    db.add(train)
    await admin_service.record_audit(
        action="CREATE_TRAIN",
        entity_type="TRAIN",
        entity_id=train.train_number,
        user_id=current_admin.id,
        details={"train_name": train.train_name},
    )
    await db.commit()
    return ApiResponse(success=True, data={"id": str(train.id)}, message="Train listing created successfully")


@router.post("/cabs", status_code=status.HTTP_201_CREATED)
async def create_cab_listing(
    payload: dict,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    admin_service = AdminService(db)
    cab = Cab(
        cab_type=payload.get("cab_type", "Sedan"),
        vehicle_model=payload.get("vehicle_model", "Maruti Dzire"),
        city=payload.get("city", "Delhi"),
        pickup_area=payload.get("pickup_area", "Indira Gandhi Airport"),
        drop_area=payload.get("drop_area", "Central Delhi"),
        driver_name=payload.get("driver_name", "Professional Chauffeur"),
        driver_rating=float(payload.get("driver_rating", 4.9)),
        capacity=int(payload.get("capacity", 4)),
        base_fare=float(payload.get("base_fare", 650)),
        currency="INR",
        eta_minutes=15,
        features=payload.get("features", ["AC", "All Tolls Included"]),
        is_simulated=True,
        is_active=True,
    )
    db.add(cab)
    await admin_service.record_audit(
        action="CREATE_CAB",
        entity_type="CAB",
        entity_id=str(cab.id),
        user_id=current_admin.id,
        details={"vehicle_model": cab.vehicle_model},
    )
    await db.commit()
    return ApiResponse(success=True, data={"id": str(cab.id)}, message="Cab listing created successfully")


@router.post("/hotels", status_code=status.HTTP_201_CREATED)
async def create_hotel_listing(
    payload: dict,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    admin_service = AdminService(db)
    hotel = Hotel(
        name=payload.get("name", "Grand Luxury Palace"),
        property_type=payload.get("property_type", "HOTEL"),
        star_rating=int(payload.get("star_rating", 5)),
        user_rating=float(payload.get("user_rating", 4.8)),
        review_count=int(payload.get("review_count", 342)),
        address=payload.get("address", "Marine Drive"),
        city=payload.get("city", "Mumbai"),
        state=payload.get("state", "Maharashtra"),
        country=payload.get("country", "India"),
        postal_code=payload.get("postal_code", "400020"),
        overview=payload.get("overview", "Premium 5-star property offering scenic views and world-class hospitality."),
        amenities=payload.get("amenities", ["Free Wi-Fi", "Swimming Pool", "Spa & Wellness", "Fine Dining", "Valet Parking"]),
        tags=payload.get("tags", ["Luxury", "Couple Friendly", "Sea View"]),
        featured_image=payload.get("featured_image", "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"),
        images=payload.get("images", ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"]),
        starting_price=float(payload.get("starting_price", 7500)),
        currency=payload.get("currency", "INR"),
        is_simulated=True,
        is_active=True,
    )
    db.add(hotel)
    await db.flush()

    # Add a default room
    room = HotelRoom(
        hotel_id=hotel.id,
        room_type="Deluxe Sea View King",
        bed_type="King Bed",
        max_occupancy=2,
        price_per_night=hotel.starting_price,
        taxes_per_night=round(hotel.starting_price * 0.18, 2),
        available_rooms=10,
        amenities=["Complimentary Breakfast", "Ocean View", "Free Wi-Fi"],
        is_available=True,
    )
    db.add(room)

    await admin_service.record_audit(
        action="CREATE_HOTEL",
        entity_type="HOTEL",
        entity_id=str(hotel.id),
        user_id=current_admin.id,
        details={"hotel_name": hotel.name, "city": hotel.city},
    )
    await db.commit()
    return ApiResponse(success=True, data={"id": str(hotel.id)}, message="Hotel property created successfully")


@router.post("/buses", status_code=status.HTTP_201_CREATED)
async def create_bus_listing(
    payload: dict,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    admin_service = AdminService(db)
    bus = Bus(
        operator_name=payload.get("operator_name", "Zingbus Premium"),
        bus_type=payload.get("bus_type", "Volvo AC Multi-Axle Sleeper (2+1)"),
        from_city=payload.get("from_city", "Delhi"),
        to_city=payload.get("to_city", "Jaipur"),
        boarding_point=payload.get("boarding_point", "ISBT Kashmere Gate"),
        dropping_point=payload.get("dropping_point", "Sindhi Camp"),
        departure_time=payload.get("departure_time", "22:30"),
        arrival_time=payload.get("arrival_time", "04:45"),
        duration_minutes=int(payload.get("duration_minutes", 375)),
        available_seats=int(payload.get("available_seats", 32)),
        base_fare=float(payload.get("base_fare", 899)),
        rating=float(payload.get("rating", 4.7)),
        currency=payload.get("currency", "INR"),
        is_simulated=True,
        is_active=True,
    )
    db.add(bus)
    await admin_service.record_audit(
        action="CREATE_BUS",
        entity_type="BUS",
        entity_id=str(bus.id),
        user_id=current_admin.id,
        details={"operator_name": bus.operator_name, "route": f"{bus.from_city} -> {bus.to_city}"},
    )
    await db.commit()
    return ApiResponse(success=True, data={"id": str(bus.id)}, message="Bus route created successfully")


@router.post("/packages", status_code=status.HTTP_201_CREATED)
async def create_package_listing(
    payload: dict,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    admin_service = AdminService(db)
    pkg = HolidayPackage(
        title=payload.get("title", "Mesmerizing Kashmir Holiday"),
        destination=payload.get("destination", "Kashmir"),
        duration_days=int(payload.get("duration_days", 5)),
        duration_nights=int(payload.get("duration_nights", 4)),
        overview=payload.get("overview", "Explore Dal Lake, Gulmarg gondola ride, Pahalgam valleys with premium 4-star stays."),
        inclusions=payload.get("inclusions", ["4 Star Hotels", "Daily Breakfast & Dinner", "Airport Transfers", "Gulmarg Sightseeing"]),
        exclusions=payload.get("exclusions", ["Flight Tickets", "Personal Expenses", "Gondola Phase 2 Tickets"]),
        itinerary=payload.get("itinerary", [
            {"day": 1, "title": "Arrival in Srinagar & Dal Lake Shikara Ride"},
            {"day": 2, "title": "Srinagar to Gulmarg Excursion"},
            {"day": 3, "title": "Gulmarg to Pahalgam Valleys"},
            {"day": 4, "title": "Pahalgam Leisure & Return to Srinagar"},
            {"day": 5, "title": "Departure Transfer to Srinagar Airport"},
        ]),
        price_per_person=float(payload.get("price_per_person", 19999)),
        currency=payload.get("currency", "INR"),
        featured_image=payload.get("featured_image", "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80"),
        rating=float(payload.get("rating", 4.9)),
        available_capacity=int(payload.get("available_capacity", 25)),
        is_simulated=True,
        is_active=True,
    )
    db.add(pkg)
    await admin_service.record_audit(
        action="CREATE_PACKAGE",
        entity_type="PACKAGE",
        entity_id=str(pkg.id),
        user_id=current_admin.id,
        details={"package_title": pkg.title, "destination": pkg.destination},
    )
    await db.commit()
    return ApiResponse(success=True, data={"id": str(pkg.id)}, message="Holiday package created successfully")


@router.patch("/inventory/{item_type}/{item_id}")
async def update_inventory_item(
    item_type: str,
    item_id: str,
    payload: Dict[str, Any],
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    admin_service = AdminService(db)
    model_map = {
        "flights": Flight,
        "hotels": Hotel,
        "buses": Bus,
        "packages": HolidayPackage,
        "trains": Train,
        "cabs": Cab,
    }
    model = model_map.get(item_type.lower())
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid inventory type: {item_type}")

    try:
        uid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    res = await db.execute(select(model).where(model.id == uid))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"{item_type[:-1].capitalize()} not found")

    updated_fields: Dict[str, Any] = {}

    # Handle common fields
    if "is_active" in payload and hasattr(item, "is_active"):
        item.is_active = bool(payload["is_active"])
        updated_fields["is_active"] = item.is_active

    # Model specific updates
    if item_type.lower() == "flights":
        if "total_price" in payload:
            item.total_price = float(payload["total_price"])
            item.base_fare = float(payload.get("base_fare", item.total_price * 0.85))
            item.taxes = round(item.total_price - item.base_fare, 2)
            updated_fields["total_price"] = item.total_price
        if "available_seats" in payload:
            item.available_seats = int(payload["available_seats"])
            updated_fields["available_seats"] = item.available_seats
        if "departure_time" in payload:
            item.departure_time = str(payload["departure_time"])
            updated_fields["departure_time"] = item.departure_time
        if "arrival_time" in payload:
            item.arrival_time = str(payload["arrival_time"])
            updated_fields["arrival_time"] = item.arrival_time

    elif item_type.lower() == "hotels":
        if "starting_price" in payload:
            item.starting_price = float(payload["starting_price"])
            updated_fields["starting_price"] = item.starting_price
            # If hotel has rooms, update first room price to match
            from sqlalchemy.orm import selectinload
            res_rooms = await db.execute(select(Hotel).options(selectinload(Hotel.rooms)).where(Hotel.id == uid))
            h_with_rooms = res_rooms.scalar_one_or_none()
            if h_with_rooms and h_with_rooms.rooms:
                for r in h_with_rooms.rooms:
                    r.price_per_night = item.starting_price
                    r.taxes_per_night = round(item.starting_price * 0.18, 2)
        if "overview" in payload:
            item.overview = str(payload["overview"])
            updated_fields["overview"] = item.overview
        if "publication_status" in payload:
            item.publication_status = str(payload["publication_status"]).upper()
            updated_fields["publication_status"] = item.publication_status

    elif item_type.lower() == "trains":
        if "base_fare" in payload:
            item.base_fare = float(payload["base_fare"])
            updated_fields["base_fare"] = item.base_fare
        if "available_seats" in payload:
            item.available_seats = int(payload["available_seats"])
            updated_fields["available_seats"] = item.available_seats
        if "departure_time" in payload:
            item.departure_time = str(payload["departure_time"])
            updated_fields["departure_time"] = item.departure_time

    elif item_type.lower() == "buses":
        if "base_fare" in payload:
            item.base_fare = float(payload["base_fare"])
            updated_fields["base_fare"] = item.base_fare
        if "available_seats" in payload:
            item.available_seats = int(payload["available_seats"])
            updated_fields["available_seats"] = item.available_seats
        if "departure_time" in payload:
            item.departure_time = str(payload["departure_time"])
            updated_fields["departure_time"] = item.departure_time

    elif item_type.lower() == "cabs":
        if "base_fare" in payload:
            item.base_fare = float(payload["base_fare"])
            updated_fields["base_fare"] = item.base_fare
        if "capacity" in payload:
            item.capacity = int(payload["capacity"])
            updated_fields["capacity"] = item.capacity
        if "driver_name" in payload:
            item.driver_name = str(payload["driver_name"])
            updated_fields["driver_name"] = item.driver_name
        if "driver_rating" in payload:
            item.driver_rating = float(payload["driver_rating"])
            updated_fields["driver_rating"] = item.driver_rating

    elif item_type.lower() == "packages":
        if "price_per_person" in payload:
            item.price_per_person = float(payload["price_per_person"])
            updated_fields["price_per_person"] = item.price_per_person
        if "available_capacity" in payload:
            item.available_capacity = int(payload["available_capacity"])
            updated_fields["available_capacity"] = item.available_capacity
        if "overview" in payload:
            item.overview = str(payload["overview"])
            updated_fields["overview"] = item.overview

    await admin_service.record_audit(
        action=f"UPDATE_{item_type.upper()[:-1]}",
        entity_type=item_type.upper()[:-1],
        entity_id=str(uid),
        user_id=current_admin.id,
        details=updated_fields,
    )
    await db.commit()
    return ApiResponse(
        success=True,
        data={"id": str(uid), **updated_fields},
        message=f"{item_type[:-1].capitalize()} updated successfully",
    )


@router.delete("/inventory/{item_type}/{item_id}")
async def delete_inventory_item(
    item_type: str,
    item_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    admin_service = AdminService(db)
    model_map = {
        "flights": Flight,
        "hotels": Hotel,
        "buses": Bus,
        "packages": HolidayPackage,
        "trains": Train,
        "cabs": Cab,
    }
    model = model_map.get(item_type.lower())
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid inventory type: {item_type}")

    try:
        uid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    res = await db.execute(select(model).where(model.id == uid))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"{item_type[:-1].capitalize()} not found")

    try:
        await db.delete(item)
        await db.commit()
    except Exception:
        # Fallback to soft-delete if foreign key or historical bookings exist
        await db.rollback()
        res_soft = await db.execute(select(model).where(model.id == uid))
        item_soft = res_soft.scalar_one_or_none()
        if item_soft and hasattr(item_soft, "is_active"):
            item_soft.is_active = False
            await db.commit()

    await admin_service.record_audit(
        action=f"DELETE_{item_type.upper()[:-1]}",
        entity_type=item_type.upper()[:-1],
        entity_id=str(uid),
        user_id=current_admin.id,
        details={"deleted_id": str(uid)},
    )
    return ApiResponse(
        success=True,
        data={"deleted_id": str(uid)},
        message=f"{item_type[:-1].capitalize()} removed from catalog successfully",
    )


# ────────── Partner Marketplace Approvals ──────────
@router.get("/properties/pending", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_pending_partner_properties(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload
    from backend.app.models.travel import ListingPublicationStatus
    from backend.app.models.partner import PartnerProfile

    query = (
        select(Hotel)
        .options(selectinload(Hotel.rooms), selectinload(Hotel.partner))
        .where(Hotel.publication_status == ListingPublicationStatus.PENDING_APPROVAL.value)
        .order_by(Hotel.created_at.desc())
    )
    results = (await db.execute(query)).scalars().all()
    out = []
    for h in results:
        partner_info = None
        if h.partner:
            partner_info = {
                "id": str(h.partner.id),
                "business_name": h.partner.business_name,
                "business_type": h.partner.business_type,
                "phone": h.partner.phone,
                "city": h.partner.city,
            }
        out.append({
            "id": str(h.id),
            "name": h.name,
            "property_type": h.property_type,
            "publication_status": h.publication_status,
            "address": h.address,
            "city": h.city,
            "country": h.country,
            "star_rating": h.star_rating,
            "starting_price": float(h.starting_price),
            "currency": h.currency,
            "featured_image": h.featured_image,
            "rooms_count": len(h.rooms) if h.rooms else 0,
            "rooms": [
                {
                    "id": str(r.id),
                    "room_type": r.room_type,
                    "price_per_night": float(r.price_per_night),
                    "available_rooms": r.available_rooms,
                }
                for r in (h.rooms or [])
            ],
            "partner": partner_info,
            "created_at": h.created_at.isoformat() if h.created_at else None,
        })
    return ApiResponse(success=True, data=out)


@router.post("/properties/{property_id}/approve", response_model=ApiResponse[Dict[str, Any]])
async def approve_partner_property(
    property_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    from backend.app.models.travel import ListingPublicationStatus

    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid property ID format")

    res = await db.execute(select(Hotel).where(Hotel.id == pid))
    hotel = res.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Property not found")

    hotel.publication_status = ListingPublicationStatus.APPROVED.value
    hotel.admin_rejection_reason = None
    hotel.approved_at = datetime.now(timezone.utc)
    hotel.approved_by_user_id = current_admin.id

    admin_service = AdminService(db)
    await admin_service.record_audit(
        action="APPROVE_PROPERTY",
        entity_type="HOTEL",
        entity_id=str(hotel.id),
        user_id=current_admin.id,
        details={"property_name": hotel.name, "property_type": hotel.property_type},
    )
    await db.commit()
    return ApiResponse(
        success=True,
        data={
            "id": str(hotel.id),
            "publication_status": hotel.publication_status,
            "approved_at": hotel.approved_at.isoformat() if hotel.approved_at else None,
        },
        message=f"Property '{hotel.name}' has been approved and is now live in public search.",
    )


@router.post("/properties/{property_id}/reject", response_model=ApiResponse[Dict[str, Any]])
async def reject_partner_property(
    property_id: str,
    payload: Dict[str, Any],
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    from backend.app.models.travel import ListingPublicationStatus

    try:
        pid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid property ID format")

    res = await db.execute(select(Hotel).where(Hotel.id == pid))
    hotel = res.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Property not found")

    reason = payload.get("rejection_reason", "Does not meet platform listing standards.")
    hotel.publication_status = ListingPublicationStatus.REJECTED.value
    hotel.admin_rejection_reason = reason

    admin_service = AdminService(db)
    await admin_service.record_audit(
        action="REJECT_PROPERTY",
        entity_type="HOTEL",
        entity_id=str(hotel.id),
        user_id=current_admin.id,
        details={"property_name": hotel.name, "reason": reason},
    )
    await db.commit()
    return ApiResponse(
        success=True,
        data={
            "id": str(hotel.id),
            "publication_status": hotel.publication_status,
            "rejection_reason": reason,
            "admin_rejection_reason": reason,
        },
        message=f"Property '{hotel.name}' has been rejected.",
    )



