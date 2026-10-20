import uuid
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.travel import Flight, Hotel, HotelRoom, Bus, HolidayPackage
from backend.app.repositories.travel_repo import TravelRepository
from backend.app.schemas.flight import (
    FlightResponse,
    AirportSchema,
    FlightSearchParams,
    FlightCreate,
)
from backend.app.schemas.hotel import (
    HotelResponse,
    HotelRoomResponse,
    HotelSearchParams,
    HotelCreate,
)
from backend.app.schemas.bus import (
    BusResponse,
    BusSearchParams,
    BusCreate,
)
from backend.app.schemas.package import (
    PackageResponse,
    PackageSearchParams,
    PackageCreate,
)


class TravelService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.travel_repo = TravelRepository(db)

    # ────────── Flight Methods ──────────
    def _map_flight(self, f: Flight) -> FlightResponse:
        return FlightResponse(
            id=str(f.id),
            airline=f.airline,
            airline_code=f.airline_code,
            flight_number=f.flight_number,
            aircraft=f.aircraft,
            origin=AirportSchema(
                code=f.origin_code,
                name=f.origin_name,
                city=f.origin_city,
                country=f.origin_country,
            ),
            destination=AirportSchema(
                code=f.destination_code,
                name=f.destination_name,
                city=f.destination_city,
                country=f.destination_country,
            ),
            departure_time=f.departure_time,
            arrival_time=f.arrival_time,
            duration_minutes=f.duration_minutes,
            stops=f.stops,
            stops_info=f.stops_info,
            cabin_class=f.cabin_class,
            available_seats=f.available_seats,
            base_fare=float(f.base_fare),
            taxes=float(f.taxes),
            total_price=float(f.total_price),
            currency=f.currency,
            is_simulated=f.is_simulated,
            logo_url=f.logo_url,
            baggage_info=f.baggage_info,
            tags=f.tags or [],
        )

    async def search_flights(
        self,
        params: FlightSearchParams,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[FlightResponse], int]:
        offset = (page - 1) * limit
        flights, total = await self.travel_repo.search_flights(
            from_code=params.from_code,
            to_code=params.to_code,
            from_city=params.from_city,
            to_city=params.to_city,
            cabin_class=params.cabin_class,
            max_price=params.max_price,
            non_stop=params.non_stop,
            limit=limit,
            offset=offset,
        )
        return [self._map_flight(f) for f in flights], total

    async def get_flight(self, flight_id: str) -> FlightResponse:
        try:
            f_uuid = uuid.UUID(flight_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid flight ID format")
        f = await self.travel_repo.get_flight_by_id(f_uuid)
        if not f or not f.is_active:
            raise HTTPException(status_code=404, detail="Flight not found")
        return self._map_flight(f)

    # ────────── Hotel Methods ──────────
    def _map_hotel(self, h: Hotel) -> HotelResponse:
        rooms = []
        if h.rooms:
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

        return HotelResponse(
            id=str(h.id),
            name=h.name,
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
            is_simulated=h.is_simulated,
            featured=h.featured,
            rooms=rooms,
        )

    async def search_hotels(
        self,
        params: HotelSearchParams,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[HotelResponse], int]:
        offset = (page - 1) * limit
        hotels, total = await self.travel_repo.search_hotels(
            city=params.city,
            min_stars=params.min_stars,
            max_price=params.max_price,
            featured_only=params.featured_only,
            limit=limit,
            offset=offset,
        )
        return [self._map_hotel(h) for h in hotels], total

    async def get_hotel(self, hotel_id: str) -> HotelResponse:
        try:
            h_uuid = uuid.UUID(hotel_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid hotel ID format")
        h = await self.travel_repo.get_hotel_by_id(h_uuid)
        if not h or not h.is_active:
            raise HTTPException(status_code=404, detail="Hotel not found")
        return self._map_hotel(h)

    # ────────── Bus Methods ──────────
    def _map_bus(self, b: Bus) -> BusResponse:
        return BusResponse(
            id=str(b.id),
            operator_name=b.operator_name,
            bus_type=b.bus_type,
            from_city=b.from_city,
            to_city=b.to_city,
            boarding_point=b.boarding_point,
            dropping_point=b.dropping_point,
            departure_time=b.departure_time,
            arrival_time=b.arrival_time,
            duration_minutes=b.duration_minutes,
            available_seats=b.available_seats,
            base_fare=float(b.base_fare),
            rating=float(b.rating),
            currency=b.currency,
            is_simulated=b.is_simulated,
        )

    async def search_buses(
        self,
        params: BusSearchParams,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[BusResponse], int]:
        offset = (page - 1) * limit
        buses, total = await self.travel_repo.search_buses(
            from_city=params.from_city,
            to_city=params.to_city,
            max_price=params.max_price,
            limit=limit,
            offset=offset,
        )
        return [self._map_bus(b) for b in buses], total

    async def get_bus(self, bus_id: str) -> BusResponse:
        try:
            b_uuid = uuid.UUID(bus_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid bus ID format")
        b = await self.travel_repo.get_bus_by_id(b_uuid)
        if not b or not b.is_active:
            raise HTTPException(status_code=404, detail="Bus schedule not found")
        return self._map_bus(b)

    # ────────── Package Methods ──────────
    def _map_package(self, p: HolidayPackage) -> PackageResponse:
        return PackageResponse(
            id=str(p.id),
            title=p.title,
            destination=p.destination,
            duration_days=p.duration_days,
            duration_nights=p.duration_nights,
            overview=p.overview,
            inclusions=p.inclusions or [],
            exclusions=p.exclusions or [],
            itinerary=p.itinerary or [],
            price_per_person=float(p.price_per_person),
            currency=p.currency,
            featured_image=p.featured_image,
            rating=float(p.rating),
            available_capacity=p.available_capacity,
            is_simulated=p.is_simulated,
        )

    async def search_packages(
        self,
        params: PackageSearchParams,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[PackageResponse], int]:
        offset = (page - 1) * limit
        packages, total = await self.travel_repo.search_packages(
            destination=params.destination,
            max_price=params.max_price,
            min_days=params.min_days,
            max_days=params.max_days,
            limit=limit,
            offset=offset,
        )
        return [self._map_package(p) for p in packages], total

    async def get_package(self, package_id: str) -> PackageResponse:
        try:
            p_uuid = uuid.UUID(package_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid package ID format")
        p = await self.travel_repo.get_package_by_id(p_uuid)
        if not p or not p.is_active:
            raise HTTPException(status_code=404, detail="Holiday package not found")
        return self._map_package(p)
