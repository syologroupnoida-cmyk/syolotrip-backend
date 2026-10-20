from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.travel import Flight, Hotel
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
