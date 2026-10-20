import uuid
from typing import Optional, List, Tuple, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.app.models.user import User
from backend.app.models.booking import Booking, BookingStatus
from backend.app.models.travel import Flight, Hotel, Bus, HolidayPackage
from backend.app.models.audit import AuditLog
from backend.app.repositories.booking_repo import BookingRepository
from backend.app.schemas.admin import DashboardStatsResponse, AuditLogResponse
from backend.app.schemas.booking import BookingResponse
from backend.app.services.booking_service import BookingService


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.booking_repo = BookingRepository(db)
        self.booking_service = BookingService(db)

    async def get_dashboard_metrics(self) -> DashboardStatsResponse:
        total_users = (await self.db.execute(select(func.count(User.id)))).scalar_one()
        total_bookings = (await self.db.execute(select(func.count(Booking.id)))).scalar_one()

        confirmed_bookings = (
            await self.db.execute(
                select(func.count(Booking.id)).where(Booking.status == BookingStatus.CONFIRMED.value)
            )
        ).scalar_one()

        pending_bookings = (
            await self.db.execute(
                select(func.count(Booking.id)).where(Booking.status == BookingStatus.PENDING.value)
            )
        ).scalar_one()

        cancelled_bookings = (
            await self.db.execute(
                select(func.count(Booking.id)).where(Booking.status == BookingStatus.CANCELLED.value)
            )
        ).scalar_one()

        revenue_val = (
            await self.db.execute(
                select(func.sum(Booking.total_amount)).where(Booking.status == BookingStatus.CONFIRMED.value)
            )
        ).scalar_one_or_none()
        total_revenue = float(revenue_val or 0.0)

        total_flights = (await self.db.execute(select(func.count(Flight.id)))).scalar_one()
        total_hotels = (await self.db.execute(select(func.count(Hotel.id)))).scalar_one()
        total_buses = (await self.db.execute(select(func.count(Bus.id)))).scalar_one()
        total_packages = (await self.db.execute(select(func.count(HolidayPackage.id)))).scalar_one()

        return DashboardStatsResponse(
            total_users=total_users,
            total_bookings=total_bookings,
            total_revenue=total_revenue,
            confirmed_bookings=confirmed_bookings,
            pending_bookings=pending_bookings,
            cancelled_bookings=cancelled_bookings,
            total_flights=total_flights,
            total_hotels=total_hotels,
            total_buses=total_buses,
            total_packages=total_packages,
            adapter_mode="MOCK_DETERMINISTIC",
        )

    async def list_bookings(
        self,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> Tuple[List[BookingResponse], int]:
        offset = (page - 1) * limit
        bookings, total = await self.booking_repo.list_all_bookings(
            status=status,
            limit=limit,
            offset=offset,
        )
        return [self.booking_service._map_booking_response(b) for b in bookings], total

    async def record_audit(
        self,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {},
        )
        self.db.add(log)
        await self.db.flush()
