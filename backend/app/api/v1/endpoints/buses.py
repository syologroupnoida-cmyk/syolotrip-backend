from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from backend.app.schemas.bus import BusResponse, BusSearchParams
from backend.app.services.travel_service import TravelService

router = APIRouter(prefix="/buses", tags=["Buses"])


@router.get("", response_model=ApiResponse[PaginatedResponse[BusResponse]])
async def search_buses(
    from_city: Optional[str] = Query(None, description="Origin city"),
    to_city: Optional[str] = Query(None, description="Destination city"),
    max_price: Optional[float] = Query(None, description="Maximum fare"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    params = BusSearchParams(
        from_city=from_city,
        to_city=to_city,
        max_price=max_price,
    )
    service = TravelService(db)
    items, total = await service.search_buses(params, page=page, limit=limit)
    pages = (total + limit - 1) // limit if total > 0 else 1

    return ApiResponse(
        success=True,
        data=PaginatedResponse(
            items=items,
            pagination=PaginationMeta(total=total, page=page, limit=limit, pages=pages),
        ),
    )


@router.get("/{bus_id}", response_model=ApiResponse[BusResponse])
async def get_bus_details(
    bus_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = TravelService(db)
    bus = await service.get_bus(bus_id)
    return ApiResponse(success=True, data=bus)
