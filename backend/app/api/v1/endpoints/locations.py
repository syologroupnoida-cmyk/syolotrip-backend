from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.location import (
    LocationsResponse,
    RouteValidationRequest,
    RouteValidationResponse,
)
from backend.app.services.location_service import LocationService

router = APIRouter(prefix="/locations", tags=["Locations & Usability"])


@router.get("", response_model=ApiResponse[LocationsResponse])
async def list_locations(
    query: Optional[str] = Query(None, description="Optional search filter on city, code, or airport name"),
    db: AsyncSession = Depends(get_db),
):
    """Returns inventory-backed location suggestions across all 6 travel verticals."""
    service = LocationService(db)
    res = await service.get_all_locations(query=query)
    return ApiResponse(success=True, data=res)


@router.post("/validate-route", response_model=ApiResponse[RouteValidationResponse])
async def validate_route(
    req: RouteValidationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Validates origin and destination pair against active scheduled inventory."""
    service = LocationService(db)
    res = await service.validate_route(category=req.category, origin=req.origin, destination=req.destination)
    return ApiResponse(success=True, data=res)
