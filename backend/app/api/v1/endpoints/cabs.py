from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from backend.app.schemas.cab import CabResponse, CabSearchParams
from backend.app.services.travel_service import TravelService

router = APIRouter(prefix="/cabs", tags=["Cabs"])


@router.get("", response_model=ApiResponse[PaginatedResponse[CabResponse]])
async def search_cabs(
    city: Optional[str] = Query(None, description="City, e.g. Delhi, Mumbai, Bengaluru"),
    cab_type: Optional[str] = Query(None, description="Type, e.g. Sedan, SUV, Luxury"),
    max_price: Optional[float] = Query(None, description="Maximum fare"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    params = CabSearchParams(
        city=city,
        cab_type=cab_type,
        max_price=max_price,
    )
    service = TravelService(db)
    items, total = await service.search_cabs(params, page=page, limit=limit)
    pages = (total + limit - 1) // limit if total > 0 else 1

    return ApiResponse(
        success=True,
        data=PaginatedResponse(
            items=items,
            pagination=PaginationMeta(total=total, page=page, limit=limit, pages=pages),
        ),
    )


@router.get("/{cab_id}", response_model=ApiResponse[CabResponse])
async def get_cab_details(
    cab_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = TravelService(db)
    cab = await service.get_cab(cab_id)
    return ApiResponse(success=True, data=cab)
