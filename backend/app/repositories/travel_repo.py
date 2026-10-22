import uuid
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from backend.app.models.travel import (
    Flight,
    Hotel,
    HotelRoom,
    Bus,
    HolidayPackage,
    Train,
    Cab,
)


class TravelRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ────────── Flights ──────────
    async def search_flights(
        self,
        from_code: Optional[str] = None,
        to_code: Optional[str] = None,
        from_city: Optional[str] = None,
        to_city: Optional[str] = None,
        cabin_class: Optional[str] = None,
        max_price: Optional[float] = None,
        non_stop: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Flight], int]:
        filters = [Flight.is_active.is_(True)]

        if from_code:
            filters.append(func.lower(Flight.origin_code) == from_code.lower().strip())
        if to_code:
            filters.append(func.lower(Flight.destination_code) == to_code.lower().strip())
        if from_city:
            filters.append(Flight.origin_city.ilike(f"%{from_city.strip()}%"))
        if to_city:
            filters.append(Flight.destination_city.ilike(f"%{to_city.strip()}%"))
        if cabin_class:
            filters.append(func.lower(Flight.cabin_class) == cabin_class.lower().strip())
        if max_price:
            filters.append(Flight.total_price <= max_price)
        if non_stop is not None and non_stop:
            filters.append(Flight.stops == 0)

        count_query = select(func.count(Flight.id)).where(and_(*filters))
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            select(Flight)
            .where(and_(*filters))
            .order_by(Flight.total_price.asc())
            .limit(limit)
            .offset(offset)
        )
        items = list((await self.db.execute(query)).scalars().all())
        return items, total

    async def get_flight_by_id(self, flight_id: uuid.UUID) -> Optional[Flight]:
        query = select(Flight).where(Flight.id == flight_id)
        return (await self.db.execute(query)).scalar_one_or_none()

    async def create_flight(self, flight: Flight) -> Flight:
        self.db.add(flight)
        await self.db.flush()
        await self.db.refresh(flight)
        return flight

    # ────────── Hotels ──────────
    async def search_hotels(
        self,
        city: Optional[str] = None,
        min_stars: Optional[int] = None,
        max_price: Optional[float] = None,
        featured_only: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Hotel], int]:
        filters = [Hotel.is_active.is_(True)]

        if city:
            filters.append(Hotel.city.ilike(f"%{city.strip()}%"))
        if min_stars:
            filters.append(Hotel.star_rating >= min_stars)
        if max_price:
            filters.append(Hotel.starting_price <= max_price)
        if featured_only:
            filters.append(Hotel.featured.is_(True))

        count_query = select(func.count(Hotel.id)).where(and_(*filters))
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            select(Hotel)
            .options(selectinload(Hotel.rooms))
            .where(and_(*filters))
            .order_by(Hotel.guest_rating.desc(), Hotel.starting_price.asc())
            .limit(limit)
            .offset(offset)
        )
        items = list((await self.db.execute(query)).scalars().all())
        return items, total

    async def get_hotel_by_id(self, hotel_id: uuid.UUID) -> Optional[Hotel]:
        query = (
            select(Hotel)
            .options(selectinload(Hotel.rooms))
            .where(Hotel.id == hotel_id)
        )
        return (await self.db.execute(query)).scalar_one_or_none()

    async def get_hotel_room_by_id(self, room_id: uuid.UUID) -> Optional[HotelRoom]:
        query = select(HotelRoom).where(HotelRoom.id == room_id)
        return (await self.db.execute(query)).scalar_one_or_none()

    async def create_hotel(self, hotel: Hotel) -> Hotel:
        self.db.add(hotel)
        await self.db.flush()
        await self.db.refresh(hotel)
        return hotel

    # ────────── Buses ──────────
    async def search_buses(
        self,
        from_city: Optional[str] = None,
        to_city: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Bus], int]:
        filters = [Bus.is_active.is_(True)]

        if from_city:
            filters.append(Bus.from_city.ilike(f"%{from_city.strip()}%"))
        if to_city:
            filters.append(Bus.to_city.ilike(f"%{to_city.strip()}%"))
        if max_price:
            filters.append(Bus.base_fare <= max_price)

        count_query = select(func.count(Bus.id)).where(and_(*filters))
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            select(Bus)
            .where(and_(*filters))
            .order_by(Bus.base_fare.asc())
            .limit(limit)
            .offset(offset)
        )
        items = list((await self.db.execute(query)).scalars().all())
        return items, total

    async def get_bus_by_id(self, bus_id: uuid.UUID) -> Optional[Bus]:
        query = select(Bus).where(Bus.id == bus_id)
        return (await self.db.execute(query)).scalar_one_or_none()

    async def create_bus(self, bus: Bus) -> Bus:
        self.db.add(bus)
        await self.db.flush()
        await self.db.refresh(bus)
        return bus

    # ────────── Holiday Packages ──────────
    async def search_packages(
        self,
        destination: Optional[str] = None,
        max_price: Optional[float] = None,
        min_days: Optional[int] = None,
        max_days: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[HolidayPackage], int]:
        filters = [HolidayPackage.is_active.is_(True)]

        if destination:
            filters.append(HolidayPackage.destination.ilike(f"%{destination.strip()}%"))
        if max_price:
            filters.append(HolidayPackage.price_per_person <= max_price)
        if min_days:
            filters.append(HolidayPackage.duration_days >= min_days)
        if max_days:
            filters.append(HolidayPackage.duration_days <= max_days)

        count_query = select(func.count(HolidayPackage.id)).where(and_(*filters))
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            select(HolidayPackage)
            .where(and_(*filters))
            .order_by(HolidayPackage.rating.desc(), HolidayPackage.price_per_person.asc())
            .limit(limit)
            .offset(offset)
        )
        items = list((await self.db.execute(query)).scalars().all())
        return items, total

    async def get_package_by_id(self, package_id: uuid.UUID) -> Optional[HolidayPackage]:
        query = select(HolidayPackage).where(HolidayPackage.id == package_id)
        return (await self.db.execute(query)).scalar_one_or_none()

    async def create_package(self, package: HolidayPackage) -> HolidayPackage:
        self.db.add(package)
        await self.db.flush()
        await self.db.refresh(package)
        return package

    # ────────── Trains ──────────
    async def search_trains(
        self,
        from_city: Optional[str] = None,
        to_city: Optional[str] = None,
        from_station: Optional[str] = None,
        to_station: Optional[str] = None,
        train_class: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Train], int]:
        filters = [Train.is_active.is_(True)]

        if from_city:
            filters.append(Train.from_city.ilike(f"%{from_city.strip()}%"))
        if to_city:
            filters.append(Train.to_city.ilike(f"%{to_city.strip()}%"))
        if from_station:
            filters.append(
                or_(
                    Train.from_station_code.ilike(f"%{from_station.strip()}%"),
                    Train.from_station_name.ilike(f"%{from_station.strip()}%"),
                )
            )
        if to_station:
            filters.append(
                or_(
                    Train.to_station_code.ilike(f"%{to_station.strip()}%"),
                    Train.to_station_name.ilike(f"%{to_station.strip()}%"),
                )
            )
        if train_class:
            filters.append(Train.train_class.ilike(f"%{train_class.strip()}%"))
        if max_price:
            filters.append(Train.base_fare <= max_price)

        count_query = select(func.count(Train.id)).where(and_(*filters))
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            select(Train)
            .where(and_(*filters))
            .order_by(Train.base_fare.asc())
            .limit(limit)
            .offset(offset)
        )
        items = list((await self.db.execute(query)).scalars().all())
        return items, total

    async def get_train_by_id(self, train_id: uuid.UUID) -> Optional[Train]:
        query = select(Train).where(Train.id == train_id)
        return (await self.db.execute(query)).scalar_one_or_none()

    async def create_train(self, train: Train) -> Train:
        self.db.add(train)
        await self.db.flush()
        await self.db.refresh(train)
        return train

    # ────────── Cabs ──────────
    async def search_cabs(
        self,
        city: Optional[str] = None,
        cab_type: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Cab], int]:
        filters = [Cab.is_active.is_(True)]

        if city:
            filters.append(Cab.city.ilike(f"%{city.strip()}%"))
        if cab_type:
            filters.append(Cab.cab_type.ilike(f"%{cab_type.strip()}%"))
        if max_price:
            filters.append(Cab.base_fare <= max_price)

        count_query = select(func.count(Cab.id)).where(and_(*filters))
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            select(Cab)
            .where(and_(*filters))
            .order_by(Cab.base_fare.asc())
            .limit(limit)
            .offset(offset)
        )
        items = list((await self.db.execute(query)).scalars().all())
        return items, total

    async def get_cab_by_id(self, cab_id: uuid.UUID) -> Optional[Cab]:
        query = select(Cab).where(Cab.id == cab_id)
        return (await self.db.execute(query)).scalar_one_or_none()

    async def create_cab(self, cab: Cab) -> Cab:
        self.db.add(cab)
        await self.db.flush()
        await self.db.refresh(cab)
        return cab
