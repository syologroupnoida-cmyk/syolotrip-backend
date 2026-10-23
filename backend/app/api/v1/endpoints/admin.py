import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.booking import Booking
from backend.app.models.audit import AuditLog
from backend.app.models.travel import Flight, Hotel, HotelRoom, Bus, Train, Cab, HolidayPackage
from backend.app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from backend.app.schemas.admin import DashboardStatsResponse
from backend.app.schemas.booking import BookingResponse
from backend.app.schemas.flight import FlightCreate, FlightResponse
from backend.app.schemas.hotel import HotelCreate, HotelResponse
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


@router.get("/coupons")
async def list_admin_coupons(
    current_admin: User = Depends(get_current_admin),
):
    coupons = [
        { "code": "MMTFLIGHT", "discount": "₹1,250 OFF", "min_order": 5000, "service": "FLIGHT", "status": "ACTIVE" },
        { "code": "MMTHOTEL", "discount": "25% OFF (Up to ₹2,500)", "min_order": 3000, "service": "HOTEL", "status": "ACTIVE" },
        { "code": "MMTHOLIDAY", "discount": "₹2,500 FLAT OFF", "min_order": 15000, "service": "PACKAGE", "status": "ACTIVE" },
        { "code": "MMTTRAIN", "discount": "₹150 Zero Fee", "min_order": 800, "service": "TRAIN", "status": "ACTIVE" },
        { "code": "MMTBUS", "discount": "₹200 Instant", "min_order": 700, "service": "BUS", "status": "ACTIVE" },
        { "code": "MMTCAB", "discount": "₹100 Off Toll", "min_order": 500, "service": "CAB", "status": "ACTIVE" },
        { "code": "MYBIZCORP", "discount": "Corporate 10% Extra", "min_order": 10000, "service": "MYBIZ", "status": "ACTIVE" },
    ]
    return ApiResponse(success=True, data=coupons)


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

    await db.delete(item)
    await admin_service.record_audit(
        action=f"DELETE_{item_type.upper()[:-1]}",
        entity_type=item_type.upper()[:-1],
        entity_id=str(uid),
        user_id=current_admin.id,
        details={"deleted_id": str(uid)},
    )
    await db.commit()
    return ApiResponse(success=True, message=f"{item_type[:-1].capitalize()} removed from catalog successfully")


