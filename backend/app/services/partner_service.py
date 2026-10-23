import uuid
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from backend.app.models.user import User, UserRole
from backend.app.models.partner import PartnerProfile, PartnerStatus, PartnerBusinessType
from backend.app.models.travel import (
    Hotel,
    HotelRoom,
    RoomDailyInventory,
    PropertyType,
    ListingPublicationStatus,
)
from backend.app.models.booking import Booking, BookingItem
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
from backend.app.services.booking_service import BookingService


class PartnerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _map_profile(self, p: PartnerProfile) -> PartnerProfileResponse:
        return PartnerProfileResponse(
            id=str(p.id),
            user_id=str(p.user_id),
            business_name=p.business_name,
            business_type=p.business_type,
            phone=p.phone,
            city=p.city,
            address=p.address,
            country=p.country,
            tax_id=p.tax_id,
            status=p.status,
            is_verified=p.is_verified,
            commission_rate=float(p.commission_rate),
            is_commission_active=p.is_commission_active,
            rejection_reason=p.rejection_reason,
            verified_at=p.verified_at.isoformat() if p.verified_at else None,
            created_at=p.created_at.isoformat(),
        )

    def _map_property(self, h: Hotel) -> PartnerPropertyResponse:
        rooms = []
        if "rooms" in h.__dict__ and h.rooms:
            for r in h.rooms:
                rooms.append(
                    HotelRoomResponse(
                        id=str(r.id),
                        room_type=r.room_type,
                        bed_type=r.bed_type,
                        max_occupancy=r.max_occupancy,
                        price_per_night=float(r.price_per_night),
                        taxes_per_night=float(r.taxes_per_night),
                        available_rooms=r.available_rooms,
                        amenities=r.amenities or [],
                        images=r.images or [],
                        is_available=r.is_available,
                    )
                )

        return PartnerPropertyResponse(
            id=str(h.id),
            partner_id=str(h.partner_id) if h.partner_id else None,
            name=h.name,
            property_type=h.property_type or "HOTEL",
            publication_status=h.publication_status,
            admin_rejection_reason=h.admin_rejection_reason,
            approved_at=h.approved_at.isoformat() if h.approved_at else None,
            star_rating=h.star_rating,
            guest_rating=float(h.guest_rating),
            rating_label=h.rating_label,
            review_count=h.review_count,
            address=h.address,
            city=h.city,
            country=h.country,
            neighborhood=h.neighborhood,
            overview=h.overview,
            amenities=h.amenities or [],
            tags=h.tags or [],
            featured_image=h.featured_image,
            images=h.images or [],
            starting_price=float(h.starting_price),
            currency=h.currency,
            is_active=h.is_active,
            featured=h.featured,
            rooms=rooms,
        )

    async def register_partner(
        self,
        current_user: User,
        req: PartnerRegisterRequest,
    ) -> PartnerProfileResponse:
        """Registers the current user as a partner or updates their partner profile."""
        query = select(PartnerProfile).where(PartnerProfile.user_id == current_user.id)
        result = await self.db.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            existing.business_name = req.business_name
            existing.business_type = req.business_type.upper()
            if req.phone:
                existing.phone = req.phone
            if req.city:
                existing.city = req.city
            if req.address:
                existing.address = req.address
            if req.tax_id:
                existing.tax_id = req.tax_id
            await self.db.flush()
            await self.db.refresh(existing)
            return self._map_profile(existing)

        # Elevate user role to PARTNER if they were CUSTOMER
        if current_user.role != UserRole.ADMIN.value:
            current_user.role = UserRole.PARTNER.value

        new_profile = PartnerProfile(
            user_id=current_user.id,
            business_name=req.business_name,
            business_type=req.business_type.upper(),
            phone=req.phone or current_user.phone,
            city=req.city,
            address=req.address,
            tax_id=req.tax_id,
            status=PartnerStatus.PENDING.value,
            is_verified=False,
            commission_rate=0.00,
            is_commission_active=False,
        )
        self.db.add(new_profile)
        await self.db.flush()
        await self.db.refresh(new_profile)
        return self._map_profile(new_profile)

    async def get_profile(self, partner: PartnerProfile) -> PartnerProfileResponse:
        return self._map_profile(partner)

    async def update_profile(
        self,
        partner: PartnerProfile,
        req: PartnerProfileUpdate,
    ) -> PartnerProfileResponse:
        if req.business_name is not None:
            partner.business_name = req.business_name
        if req.business_type is not None:
            partner.business_type = req.business_type.upper()
        if req.phone is not None:
            partner.phone = req.phone
        if req.city is not None:
            partner.city = req.city
        if req.address is not None:
            partner.address = req.address
        if req.tax_id is not None:
            partner.tax_id = req.tax_id

        await self.db.flush()
        await self.db.refresh(partner)
        return self._map_profile(partner)

    # ────────── Properties ──────────
    async def list_properties(
        self,
        partner: PartnerProfile,
        status_filter: Optional[str] = None,
    ) -> List[PartnerPropertyResponse]:
        query = (
            select(Hotel)
            .options(selectinload(Hotel.rooms))
            .where(Hotel.partner_id == partner.id)
        )
        if status_filter:
            query = query.where(Hotel.publication_status == status_filter.upper())
        query = query.order_by(Hotel.created_at.desc())
        items = (await self.db.execute(query)).scalars().all()
        return [self._map_property(h) for h in items]

    async def create_property_draft(
        self,
        partner: PartnerProfile,
        req: PartnerPropertyCreate,
    ) -> PartnerPropertyResponse:
        prop_type = req.property_type.upper()
        if prop_type not in [PropertyType.HOTEL.value, PropertyType.HOMESTAY.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Partners may only register HOTEL or HOMESTAY properties.",
            )

        new_hotel = Hotel(
            name=req.name,
            property_type=prop_type,
            partner_id=partner.id,
            publication_status=ListingPublicationStatus.DRAFT.value,
            star_rating=req.star_rating,
            guest_rating=9.0,
            rating_label="New Partner Listing",
            review_count=0,
            address=req.address,
            city=req.city,
            country=req.country,
            neighborhood=req.neighborhood,
            overview=req.overview,
            amenities=req.amenities or [],
            tags=req.tags or [prop_type.lower(), "partner_verified"],
            featured_image=req.featured_image,
            images=req.images or [req.featured_image],
            starting_price=req.starting_price,
            currency=req.currency,
            is_active=True,
            is_simulated=False,
            featured=False,
        )
        self.db.add(new_hotel)
        await self.db.flush()
        query = select(Hotel).options(selectinload(Hotel.rooms)).where(Hotel.id == new_hotel.id)
        loaded = (await self.db.execute(query)).scalar_one()
        return self._map_property(loaded)

    async def get_property(
        self,
        partner: PartnerProfile,
        property_id: uuid.UUID,
    ) -> PartnerPropertyResponse:
        query = (
            select(Hotel)
            .options(selectinload(Hotel.rooms))
            .where(and_(Hotel.id == property_id, Hotel.partner_id == partner.id))
        )
        hotel = (await self.db.execute(query)).scalar_one_or_none()
        if not hotel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found or does not belong to you.",
            )
        return self._map_property(hotel)

    async def update_property(
        self,
        partner: PartnerProfile,
        property_id: uuid.UUID,
        req: PartnerPropertyUpdate,
    ) -> PartnerPropertyResponse:
        query = (
            select(Hotel)
            .options(selectinload(Hotel.rooms))
            .where(and_(Hotel.id == property_id, Hotel.partner_id == partner.id))
        )
        hotel = (await self.db.execute(query)).scalar_one_or_none()
        if not hotel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found or access denied.",
            )

        if req.name is not None:
            hotel.name = req.name
        if req.property_type is not None:
            pt = req.property_type.upper()
            if pt not in [PropertyType.HOTEL.value, PropertyType.HOMESTAY.value]:
                raise HTTPException(status_code=400, detail="Only HOTEL or HOMESTAY is allowed.")
            hotel.property_type = pt
        if req.star_rating is not None:
            hotel.star_rating = req.star_rating
        if req.address is not None:
            hotel.address = req.address
        if req.city is not None:
            hotel.city = req.city
        if req.country is not None:
            hotel.country = req.country
        if req.neighborhood is not None:
            hotel.neighborhood = req.neighborhood
        if req.overview is not None:
            hotel.overview = req.overview
        if req.amenities is not None:
            hotel.amenities = req.amenities
        if req.tags is not None:
            hotel.tags = req.tags
        if req.featured_image is not None:
            hotel.featured_image = req.featured_image
        if req.images is not None:
            hotel.images = req.images
        if req.starting_price is not None:
            hotel.starting_price = req.starting_price
        if req.currency is not None:
            hotel.currency = req.currency
        if req.is_active is not None:
            hotel.is_active = req.is_active

        await self.db.flush()
        query = select(Hotel).options(selectinload(Hotel.rooms)).where(Hotel.id == hotel.id)
        loaded = (await self.db.execute(query)).scalar_one()
        return self._map_property(loaded)

    async def submit_property_for_approval(
        self,
        partner: PartnerProfile,
        property_id: uuid.UUID,
    ) -> PartnerPropertyResponse:
        query = (
            select(Hotel)
            .options(selectinload(Hotel.rooms))
            .where(and_(Hotel.id == property_id, Hotel.partner_id == partner.id))
        )
        hotel = (await self.db.execute(query)).scalar_one_or_none()
        if not hotel:
            raise HTTPException(status_code=404, detail="Property not found or access denied.")

        if not hotel.rooms or len(hotel.rooms) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must add at least one room/unit before submitting for approval.",
            )

        hotel.publication_status = ListingPublicationStatus.PENDING_APPROVAL.value
        hotel.admin_rejection_reason = None
        await self.db.flush()
        reload_query = select(Hotel).options(selectinload(Hotel.rooms)).where(Hotel.id == hotel.id)
        loaded = (await self.db.execute(reload_query)).scalar_one()
        return self._map_property(loaded)

    # ────────── Rooms ──────────
    async def add_room(
        self,
        partner: PartnerProfile,
        property_id: uuid.UUID,
        req: PartnerRoomCreate,
    ) -> HotelRoomResponse:
        query = select(Hotel).where(and_(Hotel.id == property_id, Hotel.partner_id == partner.id))
        hotel = (await self.db.execute(query)).scalar_one_or_none()
        if not hotel:
            raise HTTPException(status_code=404, detail="Property not found or access denied.")

        room = HotelRoom(
            hotel_id=property_id,
            room_type=req.room_type,
            bed_type=req.bed_type,
            max_occupancy=req.max_occupancy,
            price_per_night=req.price_per_night,
            taxes_per_night=req.taxes_per_night,
            available_rooms=req.available_rooms,
            amenities=req.amenities or [],
            images=req.images or [],
            is_available=True,
        )
        self.db.add(room)
        await self.db.flush()
        await self.db.refresh(room)
        return HotelRoomResponse(
            id=str(room.id),
            room_type=room.room_type,
            bed_type=room.bed_type,
            max_occupancy=room.max_occupancy,
            price_per_night=float(room.price_per_night),
            taxes_per_night=float(room.taxes_per_night),
            available_rooms=room.available_rooms,
            amenities=room.amenities or [],
            images=room.images or [],
            is_available=room.is_available,
        )

    async def update_room(
        self,
        partner: PartnerProfile,
        property_id: uuid.UUID,
        room_id: uuid.UUID,
        req: PartnerRoomUpdate,
    ) -> HotelRoomResponse:
        query = (
            select(HotelRoom)
            .join(Hotel, HotelRoom.hotel_id == Hotel.id)
            .where(
                and_(
                    HotelRoom.id == room_id,
                    HotelRoom.hotel_id == property_id,
                    Hotel.partner_id == partner.id,
                )
            )
        )
        room = (await self.db.execute(query)).scalar_one_or_none()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found or access denied.")

        if req.room_type is not None:
            room.room_type = req.room_type
        if req.bed_type is not None:
            room.bed_type = req.bed_type
        if req.max_occupancy is not None:
            room.max_occupancy = req.max_occupancy
        if req.price_per_night is not None:
            room.price_per_night = req.price_per_night
        if req.taxes_per_night is not None:
            room.taxes_per_night = req.taxes_per_night
        if req.available_rooms is not None:
            room.available_rooms = req.available_rooms
        if req.amenities is not None:
            room.amenities = req.amenities
        if req.images is not None:
            room.images = req.images
        if req.is_available is not None:
            room.is_available = req.is_available

        await self.db.flush()
        await self.db.refresh(room)
        return HotelRoomResponse(
            id=str(room.id),
            room_type=room.room_type,
            bed_type=room.bed_type,
            max_occupancy=room.max_occupancy,
            price_per_night=float(room.price_per_night),
            taxes_per_night=float(room.taxes_per_night),
            available_rooms=room.available_rooms,
            amenities=room.amenities or [],
            images=room.images or [],
            is_available=room.is_available,
        )

    async def delete_room(
        self,
        partner: PartnerProfile,
        property_id: uuid.UUID,
        room_id: uuid.UUID,
    ):
        query = (
            select(HotelRoom)
            .join(Hotel, HotelRoom.hotel_id == Hotel.id)
            .where(
                and_(
                    HotelRoom.id == room_id,
                    HotelRoom.hotel_id == property_id,
                    Hotel.partner_id == partner.id,
                )
            )
        )
        room = (await self.db.execute(query)).scalar_one_or_none()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found or access denied.")
        await self.db.delete(room)
        await self.db.flush()

    # ────────── Daily Availability & Price Overrides ──────────
    async def set_daily_inventory(
        self,
        partner: PartnerProfile,
        property_id: uuid.UUID,
        room_id: uuid.UUID,
        req: DailyInventorySetRequest,
    ) -> DailyInventoryResponse:
        query = (
            select(HotelRoom)
            .join(Hotel, HotelRoom.hotel_id == Hotel.id)
            .where(
                and_(
                    HotelRoom.id == room_id,
                    HotelRoom.hotel_id == property_id,
                    Hotel.partner_id == partner.id,
                )
            )
        )
        room = (await self.db.execute(query)).scalar_one_or_none()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found or access denied.")

        inv_query = select(RoomDailyInventory).where(
            and_(
                RoomDailyInventory.room_id == room_id,
                RoomDailyInventory.date == req.date,
            )
        )
        inv = (await self.db.execute(inv_query)).scalar_one_or_none()
        if inv:
            inv.available_rooms = req.available_rooms
            inv.price_override = req.price_override
            inv.is_blocked = req.is_blocked
        else:
            inv = RoomDailyInventory(
                room_id=room_id,
                date=req.date,
                available_rooms=req.available_rooms,
                price_override=req.price_override,
                is_blocked=req.is_blocked,
            )
            self.db.add(inv)

        await self.db.flush()
        await self.db.refresh(inv)
        return DailyInventoryResponse(
            id=str(inv.id),
            room_id=str(inv.room_id),
            date=inv.date,
            available_rooms=inv.available_rooms,
            price_override=float(inv.price_override) if inv.price_override is not None else None,
            is_blocked=inv.is_blocked,
        )

    async def list_daily_inventory(
        self,
        partner: PartnerProfile,
        property_id: uuid.UUID,
        room_id: uuid.UUID,
    ) -> List[DailyInventoryResponse]:
        query = (
            select(RoomDailyInventory)
            .join(HotelRoom, RoomDailyInventory.room_id == HotelRoom.id)
            .join(Hotel, HotelRoom.hotel_id == Hotel.id)
            .where(
                and_(
                    HotelRoom.id == room_id,
                    HotelRoom.hotel_id == property_id,
                    Hotel.partner_id == partner.id,
                )
            )
            .order_by(RoomDailyInventory.date.asc())
        )
        items = (await self.db.execute(query)).scalars().all()
        return [
            DailyInventoryResponse(
                id=str(inv.id),
                room_id=str(inv.room_id),
                date=inv.date,
                available_rooms=inv.available_rooms,
                price_override=float(inv.price_override) if inv.price_override is not None else None,
                is_blocked=inv.is_blocked,
            )
            for inv in items
        ]

    # ────────── Partner Bookings Isolation ──────────
    async def list_partner_bookings(
        self,
        partner: PartnerProfile,
    ) -> List[BookingResponse]:
        """Returns only bookings for properties owned by this partner."""
        # Find partner property IDs
        prop_query = select(Hotel.id).where(Hotel.partner_id == partner.id)
        prop_ids = (await self.db.execute(prop_query)).scalars().all()
        if not prop_ids:
            return []

        # Find bookings having items linked to partner's properties
        booking_query = (
            select(Booking)
            .join(BookingItem, Booking.id == BookingItem.booking_id)
            .where(BookingItem.hotel_id.in_(prop_ids))
            .options(
                selectinload(Booking.items),
                selectinload(Booking.passengers),
                selectinload(Booking.status_history),
            )
            .distinct()
            .order_by(Booking.created_at.desc())
        )
        bookings = (await self.db.execute(booking_query)).scalars().all()
        booking_service = BookingService(self.db)
        return [booking_service._map_booking_response(b) for b in bookings]
