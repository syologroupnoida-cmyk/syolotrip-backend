from typing import List, Optional
from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.booking import (
    BookingCreateRequest,
    BookingCancelRequest,
    BookingResponse,
)
from backend.app.services.booking_service import BookingService
from backend.app.api.v1.deps import get_current_user, get_optional_current_user

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=ApiResponse[BookingResponse], status_code=status.HTTP_201_CREATED)
async def create_booking(
    req: BookingCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingService(db)
    booking = await service.create_booking(req, current_user=current_user)
    await db.commit()
    return ApiResponse(
        success=True,
        data=booking,
        message="Booking initialized successfully in PENDING status. Awaiting payment.",
    )


@router.get("/my-trips", response_model=ApiResponse[List[BookingResponse]])
async def get_my_trips(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingService(db)
    trips = await service.get_my_trips(current_user)
    return ApiResponse(success=True, data=trips)


@router.get("/{id_or_ref}", response_model=ApiResponse[BookingResponse])
async def get_booking_details(
    id_or_ref: str,
    token: Optional[str] = Query(None, description="Access token for guest bookings"),
    x_booking_token: Optional[str] = Header(None, alias="X-Booking-Token"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingService(db)
    guest_token = token or x_booking_token
    booking = await service.get_booking(id_or_ref, current_user=current_user, guest_token=guest_token)
    return ApiResponse(success=True, data=booking)


@router.post("/{id_or_ref}/cancel", response_model=ApiResponse[BookingResponse])
async def cancel_booking(
    id_or_ref: str,
    req: BookingCancelRequest,
    token: Optional[str] = Query(None, description="Cancellation token for guest bookings"),
    x_booking_token: Optional[str] = Header(None, alias="X-Booking-Token"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingService(db)
    guest_token = req.cancellation_token or token or x_booking_token
    cancelled = await service.cancel_booking(id_or_ref, req, current_user=current_user, guest_token=guest_token)
    await db.commit()
    return ApiResponse(
        success=True,
        data=cancelled,
        message="Booking cancelled successfully.",
    )

