from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from backend.app.schemas.train import TrainResponse, TrainSearchParams
from backend.app.services.travel_service import TravelService

router = APIRouter(prefix="/trains", tags=["Trains"])


@router.get("", response_model=ApiResponse[PaginatedResponse[TrainResponse]])
async def search_trains(
    from_city: Optional[str] = Query(None, description="Origin city, e.g. Delhi"),
    to_city: Optional[str] = Query(None, description="Destination city, e.g. Mumbai, Varanasi"),
    from_station: Optional[str] = Query(None, description="Station code or name, e.g. NDLS"),
    to_station: Optional[str] = Query(None, description="Station code or name, e.g. BCT"),
    train_class: Optional[str] = Query(None, description="Class, e.g. CC, EC, 3A"),
    max_price: Optional[float] = Query(None, description="Maximum fare"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    params = TrainSearchParams(
        from_city=from_city,
        to_city=to_city,
        from_station=from_station,
        to_station=to_station,
        train_class=train_class,
        max_price=max_price,
    )
    service = TravelService(db)
    items, total = await service.search_trains(params, page=page, limit=limit)
    pages = (total + limit - 1) // limit if total > 0 else 1

    return ApiResponse(
        success=True,
        data=PaginatedResponse(
            items=items,
            pagination=PaginationMeta(total=total, page=page, limit=limit, pages=pages),
        ),
    )


@router.get("/{train_id}", response_model=ApiResponse[TrainResponse])
async def get_train_details(
    train_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = TravelService(db)
    train = await service.get_train(train_id)
    return ApiResponse(success=True, data=train)
