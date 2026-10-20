from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from backend.app.schemas.package import PackageResponse, PackageSearchParams
from backend.app.services.travel_service import TravelService

router = APIRouter(prefix="/packages", tags=["Holiday Packages"])


@router.get("", response_model=ApiResponse[PaginatedResponse[PackageResponse]])
async def search_packages(
    destination: Optional[str] = Query(None, description="Destination, e.g. Tokyo, Bali, Paris"),
    max_price: Optional[float] = Query(None, description="Maximum package price"),
    min_days: Optional[int] = Query(None, ge=1),
    max_days: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    params = PackageSearchParams(
        destination=destination,
        max_price=max_price,
        min_days=min_days,
        max_days=max_days,
    )
    service = TravelService(db)
    items, total = await service.search_packages(params, page=page, limit=limit)
    pages = (total + limit - 1) // limit if total > 0 else 1

    return ApiResponse(
        success=True,
        data=PaginatedResponse(
            items=items,
            pagination=PaginationMeta(total=total, page=page, limit=limit, pages=pages),
        ),
    )


@router.get("/{package_id}", response_model=ApiResponse[PackageResponse])
async def get_package_details(
    package_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = TravelService(db)
    pkg = await service.get_package(package_id)
    return ApiResponse(success=True, data=pkg)
