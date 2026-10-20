import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.travel import Flight, Hotel, HotelRoom, Bus, HolidayPackage


from sqlalchemy import select

@pytest.fixture(autouse=True)
async def seed_test_travel(db_session: AsyncSession):
    # Check if already seeded
    q = select(Flight).where(Flight.flight_number == "JL 002")
    if (await db_session.execute(q)).scalar_one_or_none():
        return

    # Add a sample flight
    flight = Flight(
        airline="Japan Airlines",
        airline_code="JAL",
        flight_number="JL 002",
        aircraft="Boeing 787-9",
        origin_code="SFO",
        origin_name="San Francisco Intl",
        origin_city="San Francisco",
        origin_country="USA",
        destination_code="HND",
        destination_name="Tokyo Haneda",
        destination_city="Tokyo",
        destination_country="Japan",
        departure_time="08:30",
        arrival_time="14:45+1",
        duration_minutes=675,
        stops=0,
        cabin_class="ECONOMY",
        available_seats=30,
        base_fare=60000.0,
        taxes=4000.0,
        total_price=64000.0,
        currency="INR",
        is_simulated=True,
        is_active=True,
    )
    db_session.add(flight)

    # Add a sample hotel with room
    hotel = Hotel(
        name="Park Hyatt Tokyo",
        star_rating=5,
        guest_rating=9.4,
        rating_label="Exceptional",
        review_count=1200,
        address="3-7-1-2 Nishi-Shinjuku",
        city="Tokyo",
        country="Japan",
        overview="Luxury hotel overlooking Shinjuku.",
        featured_image="https://example.com/park.jpg",
        starting_price=28000.0,
        currency="INR",
        is_simulated=True,
        is_active=True,
        featured=True,
    )
    db_session.add(hotel)
    await db_session.flush()

    room = HotelRoom(
        hotel_id=hotel.id,
        room_type="Deluxe King",
        bed_type="King Bed",
        max_occupancy=2,
        price_per_night=28000.0,
        taxes_per_night=2800.0,
        available_rooms=5,
        is_available=True,
    )
    db_session.add(room)

    # Add a sample bus
    bus = Bus(
        operator_name="Zingbus Express",
        bus_type="Volvo Multi-Axle",
        from_city="Delhi",
        to_city="Jaipur",
        boarding_point="Kashmere Gate",
        dropping_point="Sindhi Camp",
        departure_time="22:00",
        arrival_time="03:30+1",
        duration_minutes=330,
        available_seats=20,
        base_fare=900.0,
        rating=4.7,
        currency="INR",
        is_simulated=True,
        is_active=True,
    )
    db_session.add(bus)

    # Add a holiday package
    pkg = HolidayPackage(
        title="Tokyo Discovery 10 Days",
        destination="Tokyo, Japan",
        duration_days=10,
        duration_nights=9,
        overview="Explore Tokyo and Kyoto.",
        price_per_person=160000.0,
        currency="INR",
        featured_image="https://example.com/tokyo.jpg",
        rating=4.9,
        available_capacity=10,
        is_simulated=True,
        is_active=True,
    )
    db_session.add(pkg)
    await db_session.commit()


@pytest.mark.asyncio
async def test_search_flights(async_client: AsyncClient):
    res = await async_client.get("/api/v1/flights?from_code=SFO&to_code=HND")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) >= 1
    assert data["data"]["items"][0]["airline_code"] == "JAL"


@pytest.mark.asyncio
async def test_search_hotels(async_client: AsyncClient):
    res = await async_client.get("/api/v1/hotels?city=Tokyo")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) >= 1
    assert "Park Hyatt" in data["data"]["items"][0]["name"]


@pytest.mark.asyncio
async def test_search_buses(async_client: AsyncClient):
    res = await async_client.get("/api/v1/buses?from_city=Delhi&to_city=Jaipur")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) >= 1


@pytest.mark.asyncio
async def test_search_packages(async_client: AsyncClient):
    res = await async_client.get("/api/v1/packages?destination=Tokyo")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) >= 1
