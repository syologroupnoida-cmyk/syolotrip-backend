import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.partner import PartnerProfile
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.hotel import HotelRoomResponse
from backend.app.schemas.booking import BookingResponse
from backend.app.schemas.partner import (
    PartnerRegisterRequest,
    PartnerProfileUpdate,
    PartnerProfileResponse,
    PartnerPropertyCreate,
    PartnerPropertyUpdate,
    PartnerPropertyResponse,
    PartnerRoomCreate,
    PartnerRoomUpdate,
    DailyInventorySetRequest,
    DailyInventoryResponse,
)
from backend.app.services.partner_service import PartnerService
from backend.app.api.v1.deps import get_current_user, get_current_partner

router = APIRouter(prefix="/partner", tags=["Partner Marketplace"])


@router.post("/register", response_model=ApiResponse[PartnerProfileResponse], status_code=status.HTTP_201_CREATED)
async def register_partner(
    req: PartnerRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    profile = await service.register_partner(current_user, req)
    await db.commit()
    return ApiResponse(
        success=True,
        data=profile,
        message="Partner profile registered successfully. You may now manage properties and listings.",
    )


@router.get("/profile", response_model=ApiResponse[PartnerProfileResponse])
async def get_partner_profile(
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    profile = await service.get_profile(partner)
    return ApiResponse(success=True, data=profile)


@router.put("/profile", response_model=ApiResponse[PartnerProfileResponse])
async def update_partner_profile(
    req: PartnerProfileUpdate,
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    profile = await service.update_profile(partner, req)
    await db.commit()
    return ApiResponse(success=True, data=profile, message="Partner profile updated successfully.")


# ────────── Properties ──────────
@router.get("/properties", response_model=ApiResponse[List[PartnerPropertyResponse]])
async def list_partner_properties(
    status: Optional[str] = Query(None, description="Filter by publication status (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED)"),
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    properties = await service.list_properties(partner, status_filter=status)
    return ApiResponse(success=True, data=properties)


@router.post("/properties", response_model=ApiResponse[PartnerPropertyResponse], status_code=status.HTTP_201_CREATED)
async def create_property_draft(
    req: PartnerPropertyCreate,
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    prop = await service.create_property_draft(partner, req)
    await db.commit()
    return ApiResponse(
        success=True,
        data=prop,
        message="Property draft created successfully. Add rooms and submit for admin approval when ready.",
    )


@router.get("/properties/{property_id}", response_model=ApiResponse[PartnerPropertyResponse])
async def get_partner_property(
    property_id: uuid.UUID,
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    prop = await service.get_property(partner, property_id)
    return ApiResponse(success=True, data=prop)


@router.put("/properties/{property_id}", response_model=ApiResponse[PartnerPropertyResponse])
async def update_partner_property(
    property_id: uuid.UUID,
    req: PartnerPropertyUpdate,
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    prop = await service.update_property(partner, property_id, req)
    await db.commit()
    return ApiResponse(success=True, data=prop, message="Property updated successfully.")


@router.post("/properties/{property_id}/submit", response_model=ApiResponse[PartnerPropertyResponse])
async def submit_property_for_approval(
    property_id: uuid.UUID,
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    prop = await service.submit_property_for_approval(partner, property_id)
    await db.commit()
    return ApiResponse(
        success=True,
        data=prop,
        message="Property submitted for administrator approval.",
    )


# ────────── Rooms ──────────
@router.post("/properties/{property_id}/rooms", response_model=ApiResponse[HotelRoomResponse], status_code=status.HTTP_201_CREATED)
async def add_property_room(
    property_id: uuid.UUID,
    req: PartnerRoomCreate,
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    room = await service.add_room(partner, property_id, req)
    await db.commit()
    return ApiResponse(success=True, data=room, message="Room added successfully.")


@router.put("/properties/{property_id}/rooms/{room_id}", response_model=ApiResponse[HotelRoomResponse])
async def update_property_room(
    property_id: uuid.UUID,
    room_id: uuid.UUID,
    req: PartnerRoomUpdate,
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    room = await service.update_room(partner, property_id, room_id, req)
    await db.commit()
    return ApiResponse(success=True, data=room, message="Room updated successfully.")


@router.delete("/properties/{property_id}/rooms/{room_id}", response_model=ApiResponse[dict])
async def delete_property_room(
    property_id: uuid.UUID,
    room_id: uuid.UUID,
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    await service.delete_room(partner, property_id, room_id)
    await db.commit()
    return ApiResponse(success=True, data={"deleted": True}, message="Room deleted successfully.")


# ────────── Daily Availability & Price Overrides ──────────
@router.post("/properties/{property_id}/rooms/{room_id}/availability", response_model=ApiResponse[DailyInventoryResponse])
@router.post("/properties/{property_id}/rooms/{room_id}/inventory", response_model=ApiResponse[DailyInventoryResponse])
async def set_room_daily_availability(
    property_id: uuid.UUID,
    room_id: uuid.UUID,
    req: DailyInventorySetRequest,
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    inv = await service.set_daily_inventory(partner, property_id, room_id, req)
    await db.commit()
    return ApiResponse(success=True, data=inv, message="Daily inventory and pricing updated.")


@router.get("/properties/{property_id}/rooms/{room_id}/availability", response_model=ApiResponse[List[DailyInventoryResponse]])
@router.get("/properties/{property_id}/rooms/{room_id}/inventory", response_model=ApiResponse[List[DailyInventoryResponse]])
async def get_room_daily_availability(
    property_id: uuid.UUID,
    room_id: uuid.UUID,
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    items = await service.list_daily_inventory(partner, property_id, room_id)
    return ApiResponse(success=True, data=items)


# ────────── Partner Bookings ──────────
@router.get("/bookings", response_model=ApiResponse[List[BookingResponse]])
async def list_partner_bookings(
    partner: PartnerProfile = Depends(get_current_partner),
    db: AsyncSession = Depends(get_db),
):
    service = PartnerService(db)
    bookings = await service.list_partner_bookings(partner)
    return ApiResponse(success=True, data=bookings)
