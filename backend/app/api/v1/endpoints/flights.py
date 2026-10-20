from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from backend.app.schemas.flight import FlightResponse, FlightSearchParams
from backend.app.services.travel_service import TravelService

router = APIRouter(prefix="/flights", tags=["Flights"])


@router.get("", response_model=ApiResponse[PaginatedResponse[FlightResponse]])
async def search_flights(
    from_city: Optional[str] = Query(None, description="Origin city or name"),
    to_city: Optional[str] = Query(None, description="Destination city or name"),
    from_code: Optional[str] = Query(None, description="Origin IATA airport code, e.g. SFO or DEL"),
    to_code: Optional[str] = Query(None, description="Destination IATA airport code, e.g. HND or BOM"),
    cabin_class: Optional[str] = Query(None, description="Cabin class: ECONOMY, BUSINESS, etc."),
    max_price: Optional[float] = Query(None, description="Maximum total price"),
    non_stop: Optional[bool] = Query(None, description="Non-stop flights only"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    params = FlightSearchParams(
        from_city=from_city,
        to_city=to_city,
        from_code=from_code,
        to_code=to_code,
        cabin_class=cabin_class,
        max_price=max_price,
        non_stop=non_stop,
    )
    service = TravelService(db)
    items, total = await service.search_flights(params, page=page, limit=limit)
    pages = (total + limit - 1) // limit if total > 0 else 1

    return ApiResponse(
        success=True,
        data=PaginatedResponse(
            items=items,
            pagination=PaginationMeta(total=total, page=page, limit=limit, pages=pages),
        ),
    )


@router.get("/{flight_id}", response_model=ApiResponse[FlightResponse])
async def get_flight_details(
    flight_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = TravelService(db)
    flight = await service.get_flight(flight_id)
    return ApiResponse(success=True, data=flight)
