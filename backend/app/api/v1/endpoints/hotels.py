from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from backend.app.schemas.hotel import HotelResponse, HotelSearchParams
from backend.app.services.travel_service import TravelService

router = APIRouter(prefix="/hotels", tags=["Hotels"])


@router.get("", response_model=ApiResponse[PaginatedResponse[HotelResponse]])
async def search_hotels(
    city: Optional[str] = Query(None, description="City, e.g. Paris or Tokyo"),
    min_stars: Optional[int] = Query(None, ge=1, le=5),
    max_price: Optional[float] = Query(None, description="Maximum starting price per night"),
    featured_only: Optional[bool] = Query(None, description="Featured properties only"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    params = HotelSearchParams(
        city=city,
        min_stars=min_stars,
        max_price=max_price,
        featured_only=featured_only,
    )
    service = TravelService(db)
    items, total = await service.search_hotels(params, page=page, limit=limit)
    pages = (total + limit - 1) // limit if total > 0 else 1

    return ApiResponse(
        success=True,
        data=PaginatedResponse(
            items=items,
            pagination=PaginationMeta(total=total, page=page, limit=limit, pages=pages),
        ),
    )


@router.get("/{hotel_id}", response_model=ApiResponse[HotelResponse])
async def get_hotel_details(
    hotel_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = TravelService(db)
    hotel = await service.get_hotel(hotel_id)
    return ApiResponse(success=True, data=hotel)
