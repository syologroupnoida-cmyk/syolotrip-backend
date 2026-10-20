import uuid
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from backend.app.models.booking import (
    Booking,
    BookingItem,
    Passenger,
    BookingStatusHistory,
    BookingStatus,
)
from backend.app.models.payment import Payment, PaymentStatus


class BookingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, booking_id: uuid.UUID) -> Optional[Booking]:
        query = (
            select(Booking)
            .options(
                selectinload(Booking.items),
                selectinload(Booking.passengers),
                selectinload(Booking.status_history),
                selectinload(Booking.payments),
            )
            .where(Booking.id == booking_id)
        )
        return (await self.db.execute(query)).scalar_one_or_none()

    async def get_by_reference(self, reference: str) -> Optional[Booking]:
        query = (
            select(Booking)
            .options(
                selectinload(Booking.items),
                selectinload(Booking.passengers),
                selectinload(Booking.status_history),
                selectinload(Booking.payments),
            )
            .where(Booking.booking_reference == reference.strip())
        )
        return (await self.db.execute(query)).scalar_one_or_none()

    async def list_user_bookings(
        self,
        user_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Booking]:
        query = (
            select(Booking)
            .options(
                selectinload(Booking.items),
                selectinload(Booking.passengers),
                selectinload(Booking.status_history),
                selectinload(Booking.payments),
            )
            .where(Booking.user_id == user_id)
            .order_by(Booking.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list((await self.db.execute(query)).scalars().all())

    async def list_all_bookings(
        self,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Booking], int]:
        filters = []
        if status:
            filters.append(Booking.status == status.upper())

        count_query = select(func.count(Booking.id))
        if filters:
            count_query = count_query.where(and_(*filters))
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            select(Booking)
            .options(
                selectinload(Booking.items),
                selectinload(Booking.passengers),
                selectinload(Booking.status_history),
                selectinload(Booking.payments),
            )
        )
        if filters:
            query = query.where(and_(*filters))

        query = query.order_by(Booking.created_at.desc()).limit(limit).offset(offset)
        items = list((await self.db.execute(query)).scalars().all())
        return items, total

    async def create_booking(
        self,
        booking: Booking,
        items: List[BookingItem],
        passengers: List[Passenger],
    ) -> Booking:
        self.db.add(booking)
        await self.db.flush()

        for item in items:
            item.booking_id = booking.id
            self.db.add(item)

        for p in passengers:
            p.booking_id = booking.id
            self.db.add(p)

        # Initial status history
        history = BookingStatusHistory(
            booking_id=booking.id,
            from_status="NONE",
            to_status=booking.status,
            reason="Initial booking creation",
            changed_by_user_id=booking.user_id,
        )
        self.db.add(history)

        await self.db.flush()
        return await self.get_by_id(booking.id)

    async def update_status(
        self,
        booking: Booking,
        new_status: str,
        reason: Optional[str] = None,
        changed_by_user_id: Optional[uuid.UUID] = None,
    ) -> Booking:
        old_status = booking.status
        booking.status = new_status
        if reason and new_status == BookingStatus.CANCELLED.value:
            booking.cancellation_reason = reason

        history = BookingStatusHistory(
            booking_id=booking.id,
            from_status=old_status,
            to_status=new_status,
            reason=reason or f"Status changed from {old_status} to {new_status}",
            changed_by_user_id=changed_by_user_id,
        )
        self.db.add(history)
        await self.db.flush()
        return await self.get_by_id(booking.id)

    async def create_payment(self, payment: Payment) -> Payment:
        self.db.add(payment)
        await self.db.flush()
        await self.db.refresh(payment)
        return payment
