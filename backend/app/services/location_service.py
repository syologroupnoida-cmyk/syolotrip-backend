from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from backend.app.models.travel import Flight, Hotel, Train, Bus, Cab, HolidayPackage
from backend.app.schemas.location import (
    LocationOption,
    LocationsResponse,
    RouteValidationResponse,
)


class LocationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_locations(self, query: Optional[str] = None) -> LocationsResponse:
        clean_q = query.strip().lower() if query else None

        # 1. Flights
        f_stmt = select(Flight).where(Flight.is_active.is_(True))
        f_res = await self.db.execute(f_stmt)
        flights = f_res.scalars().all()

        airport_map: Dict[str, LocationOption] = {}
        for f in flights:
            # Origin
            if f.origin_code not in airport_map:
                airport_map[f.origin_code] = LocationOption(
                    category="flights",
                    code=f.origin_code,
                    name=f.origin_name,
                    city=f.origin_city,
                    country=f.origin_country,
                    role="origin",
                )
            elif airport_map[f.origin_code].role == "destination":
                airport_map[f.origin_code].role = "both"

            # Destination
            if f.destination_code not in airport_map:
                airport_map[f.destination_code] = LocationOption(
                    category="flights",
                    code=f.destination_code,
                    name=f.destination_name,
                    city=f.destination_city,
                    country=f.destination_country,
                    role="destination",
                )
            elif airport_map[f.destination_code].role == "origin":
                airport_map[f.destination_code].role = "both"

        airports = list(airport_map.values())
        if clean_q:
            airports = [
                a for a in airports
                if clean_q in (a.code or "").lower() or clean_q in a.city.lower() or clean_q in a.name.lower()
            ]

        # 2. Hotels
        h_stmt = select(Hotel).where(Hotel.is_active.is_(True))
        h_res = await self.db.execute(h_stmt)
        hotels = h_res.scalars().all()

        city_map: Dict[str, LocationOption] = {}
        for h in hotels:
            k = f"{h.city.lower()}_{h.country.lower()}"
            if k not in city_map:
                city_map[k] = LocationOption(
                    category="hotels",
                    code=None,
                    name=f"{h.city} ({h.country})",
                    city=h.city,
                    country=h.country,
                    role="destination",
                )

        hotel_cities = list(city_map.values())
        if clean_q:
            hotel_cities = [
                c for c in hotel_cities
                if clean_q in c.city.lower() or clean_q in (c.country or "").lower()
            ]

        # 3. Trains
        t_stmt = select(Train).where(Train.is_active.is_(True))
        t_res = await self.db.execute(t_stmt)
        trains = t_res.scalars().all()

        train_station_map: Dict[str, LocationOption] = {}
        for t in trains:
            # From
            if t.from_station_code not in train_station_map:
                train_station_map[t.from_station_code] = LocationOption(
                    category="trains",
                    code=t.from_station_code,
                    name=f"{t.from_station_name} ({t.from_station_code})",
                    city=t.from_city,
                    country="India",
                    role="origin",
                )
            # To
            if t.to_station_code not in train_station_map:
                train_station_map[t.to_station_code] = LocationOption(
                    category="trains",
                    code=t.to_station_code,
                    name=f"{t.to_station_name} ({t.to_station_code})",
                    city=t.to_city,
                    country="India",
                    role="destination",
                )

        train_stations = list(train_station_map.values())
        if clean_q:
            train_stations = [
                s for s in train_stations
                if clean_q in (s.code or "").lower() or clean_q in s.city.lower() or clean_q in s.name.lower()
            ]

        # 4. Buses
        b_stmt = select(Bus).where(Bus.is_active.is_(True))
        b_res = await self.db.execute(b_stmt)
        buses = b_res.scalars().all()

        bus_map: Dict[str, LocationOption] = {}
        for b in buses:
            for city, role in [(b.from_city, "origin"), (b.to_city, "destination")]:
                if city not in bus_map:
                    bus_map[city] = LocationOption(
                        category="buses",
                        code=None,
                        name=f"{city} Bus Terminal",
                        city=city,
                        country="India",
                        role=role,
                    )
                elif bus_map[city].role != role:
                    bus_map[city].role = "both"

        bus_cities = list(bus_map.values())
        if clean_q:
            bus_cities = [c for c in bus_cities if clean_q in c.city.lower()]

        # 5. Cabs
        c_stmt = select(Cab).where(Cab.is_active.is_(True))
        c_res = await self.db.execute(c_stmt)
        cabs = c_res.scalars().all()

        cab_map: Dict[str, LocationOption] = {}
        for c in cabs:
            if c.city not in cab_map:
                cab_map[c.city] = LocationOption(
                    category="cabs",
                    code=None,
                    name=f"{c.city} Airport & Outstation",
                    city=c.city,
                    country="India",
                    role="both",
                )

        cab_cities = list(cab_map.values())
        if clean_q:
            cab_cities = [c for c in cab_cities if clean_q in c.city.lower()]

        # 6. Packages
        p_stmt = select(HolidayPackage).where(HolidayPackage.is_active.is_(True))
        p_res = await self.db.execute(p_stmt)
        pkgs = p_res.scalars().all()

        pkg_map: Dict[str, LocationOption] = {}
        for p in pkgs:
            dest = p.destination
            if dest not in pkg_map:
                pkg_map[dest] = LocationOption(
                    category="packages",
                    code=None,
                    name=f"{dest} Holiday Experience",
                    city=dest,
                    country=getattr(p, "country", None) or "India",
                    role="destination",
                )

        package_destinations = list(pkg_map.values())
        if clean_q:
            package_destinations = [
                p for p in package_destinations
                if clean_q in p.city.lower() or clean_q in (p.country or "").lower()
            ]

        return LocationsResponse(
            airports=airports,
            hotel_cities=hotel_cities,
            train_stations=train_stations,
            bus_cities=bus_cities,
            cab_cities=cab_cities,
            package_destinations=package_destinations,
        )

    async def validate_route(self, category: str, origin: str, destination: str) -> RouteValidationResponse:
        cat = category.strip().lower()
        orig = origin.strip().upper()
        dest = destination.strip().upper()

        if orig == dest:
            return RouteValidationResponse(
                is_valid=False,
                is_same_location=True,
                message="Origin and destination cannot be the same location. Please choose a different destination.",
                suggested_destinations=[],
            )

        if cat == "flights":
            stmt = select(Flight).where(
                and_(
                    Flight.is_active.is_(True),
                    func.upper(Flight.origin_code) == orig,
                    func.upper(Flight.destination_code) == dest,
                )
            )
            exists = (await self.db.execute(stmt)).scalar_one_or_none()
            if exists:
                return RouteValidationResponse(
                    is_valid=True,
                    is_same_location=False,
                    message="Valid flight route with active scheduled inventory.",
                )

            # Suggest destinations for this origin
            alt_stmt = select(Flight).where(
                and_(Flight.is_active.is_(True), func.upper(Flight.origin_code) == orig)
            )
            alts = (await self.db.execute(alt_stmt)).scalars().all()
            suggested = [
                LocationOption(
                    category="flights",
                    code=f.destination_code,
                    name=f.destination_name,
                    city=f.destination_city,
                    country=f.destination_country,
                    role="destination",
                )
                for f in alts
            ]
            return RouteValidationResponse(
                is_valid=False,
                is_same_location=False,
                message=f"No scheduled flights found between {orig} and {dest}.",
                suggested_destinations=suggested,
            )

        elif cat == "trains":
            stmt = select(Train).where(
                and_(
                    Train.is_active.is_(True),
                    func.upper(Train.from_station_code) == orig,
                    func.upper(Train.to_station_code) == dest,
                )
            )
            exists = (await self.db.execute(stmt)).scalar_one_or_none()
            if exists:
                return RouteValidationResponse(
                    is_valid=True,
                    is_same_location=False,
                    message="Valid express train route with active scheduled inventory.",
                )

            alt_stmt = select(Train).where(
                and_(Train.is_active.is_(True), func.upper(Train.from_station_code) == orig)
            )
            alts = (await self.db.execute(alt_stmt)).scalars().all()
            suggested = [
                LocationOption(
                    category="trains",
                    code=t.to_station_code,
                    name=f"{t.to_station_name} ({t.to_station_code})",
                    city=t.to_city,
                    country="India",
                    role="destination",
                )
                for t in alts
            ]
            return RouteValidationResponse(
                is_valid=False,
                is_same_location=False,
                message=f"No scheduled trains found between station {orig} and station {dest}.",
                suggested_destinations=suggested,
            )

        elif cat == "buses":
            stmt = select(Bus).where(
                and_(
                    Bus.is_active.is_(True),
                    func.upper(Bus.from_city) == orig,
                    func.upper(Bus.to_city) == dest,
                )
            )
            exists = (await self.db.execute(stmt)).scalar_one_or_none()
            if exists:
                return RouteValidationResponse(
                    is_valid=True,
                    is_same_location=False,
                    message="Valid intercity coach route with active scheduled inventory.",
                )

            alt_stmt = select(Bus).where(
                and_(Bus.is_active.is_(True), func.upper(Bus.from_city) == orig)
            )
            alts = (await self.db.execute(alt_stmt)).scalars().all()
            suggested = [
                LocationOption(
                    category="buses",
                    code=None,
                    name=f"{b.to_city} Bus Terminal",
                    city=b.to_city,
                    country="India",
                    role="destination",
                )
                for b in alts
            ]
            return RouteValidationResponse(
                is_valid=False,
                is_same_location=False,
                message=f"No scheduled bus routes found between {orig} and {dest}.",
                suggested_destinations=suggested,
            )

        return RouteValidationResponse(
            is_valid=True,
            is_same_location=False,
            message="Location pair accepted.",
        )
