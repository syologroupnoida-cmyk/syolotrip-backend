import asyncio
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.security import create_access_token, hash_password
from backend.app.models.user import User, UserRole
from backend.app.models.travel import Flight, Bus, Train, HolidayPackage, Hotel, HotelRoom
from backend.app.models.coupon import Coupon
from backend.app.models.booking import Booking, BookingStatus


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
async def other_customer(db_session: AsyncSession) -> User:
    email = "other_customer@example.com"
    query = select(User).where(User.email == email)
    res = await db_session.execute(query)
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            full_name="Other User",
            phone="+91 99999 12345",
            hashed_password=hash_password("OtherPassword123!"),
            role=UserRole.CUSTOMER.value,
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
    return user


@pytest.fixture
async def other_headers(other_customer: User) -> dict:
    token = create_access_token(subject=str(other_customer.id), role=other_customer.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def inventory_flight(db_session: AsyncSession) -> Flight:
    flight = Flight(
        airline="Air India",
        airline_code="AI",
        flight_number="AI 303",
        aircraft="A350-900",
        origin_code="DEL",
        origin_name="Indira Gandhi Intl",
        origin_city="New Delhi",
        origin_country="India",
        destination_code="BOM",
        destination_name="Chhatrapati Shivaji Intl",
        destination_city="Mumbai",
        destination_country="India",
        departure_time="07:00",
        arrival_time="09:15",
        duration_minutes=135,
        stops=0,
        cabin_class="ECONOMY",
        available_seats=10,
        base_fare=5000.0,
        taxes=600.0,
        total_price=5600.0,
        currency="INR",
        is_simulated=True,
        is_active=True,
    )
    db_session.add(flight)
    await db_session.commit()
    await db_session.refresh(flight)
    return flight


@pytest.fixture
async def inventory_bus(db_session: AsyncSession) -> Bus:
    bus = Bus(
        operator_name="IntrCity SmartBus",
        bus_type="Volvo AC Multi-Axle",
        from_city="Delhi",
        to_city="Jaipur",
        boarding_point="Kashmere Gate",
        dropping_point="Sindhi Camp",
        departure_time="22:00",
        arrival_time="04:30+1",
        duration_minutes=390,
        available_seats=8,
        base_fare=1200.0,
        currency="INR",
        is_simulated=True,
        is_active=True,
    )
    db_session.add(bus)
    await db_session.commit()
    await db_session.refresh(bus)
    return bus


@pytest.fixture
async def inventory_train(db_session: AsyncSession) -> Train:
    train = Train(
        train_number="12002",
        train_name="Bhopal Shatabdi Express",
        train_type="Shatabdi",
        from_station_code="NDLS",
        from_station_name="New Delhi",
        from_city="Delhi",
        to_station_code="AGC",
        to_station_name="Agra Cantt",
        to_city="Agra",
        departure_time="06:00",
        arrival_time="07:50",
        duration_minutes=110,
        available_seats=15,
        base_fare=950.0,
        currency="INR",
        is_simulated=True,
        is_active=True,
    )
    db_session.add(train)
    await db_session.commit()
    await db_session.refresh(train)
    return train


@pytest.fixture
async def inventory_package(db_session: AsyncSession) -> HolidayPackage:
    pkg = HolidayPackage(
        title="Royal Rajasthan Experience",
        destination="Jaipur",
        duration_days=4,
        duration_nights=3,
        overview="Explore forts and palaces",
        price_per_person=15000.0,
        available_capacity=6,
        currency="INR",
        featured_image="https://images.unsplash.com/jaipur.jpg",
        is_simulated=True,
        is_active=True,
    )
    db_session.add(pkg)
    await db_session.commit()
    await db_session.refresh(pkg)
    return pkg


@pytest.fixture
async def inventory_hotel_room(db_session: AsyncSession) -> HotelRoom:
    hotel = Hotel(
        name="The Grand Palace Hotel",
        address="100 Rajpath Road",
        city="Jaipur",
        country="India",
        overview="Luxury heritage palace hotel",
        featured_image="https://images.unsplash.com/hotel.jpg",
        starting_price=8000.0,
        currency="INR",
        is_simulated=True,
        is_active=True,
    )
    db_session.add(hotel)
    await db_session.commit()
    await db_session.refresh(hotel)

    room = HotelRoom(
        hotel_id=hotel.id,
        room_type="Royal Heritage Suite",
        price_per_night=8000.0,
        taxes_per_night=1200.0,
        available_rooms=5,
        is_available=True,
    )
    db_session.add(room)
    await db_session.commit()
    await db_session.refresh(room)
    return room


# ---------------------------------------------------------------------------
# Task 1: SEC-04 - Secure Demo Payment Authorization & State Transitions
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sec04_unauthenticated_cannot_pay_account_booking(
    async_client: AsyncClient,
    customer_headers: dict,
    inventory_flight: Flight,
):
    # 1. Customer creates an account-linked booking
    create_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "auth_test@example.com",
            "contact_phone": "+91 98765 00001",
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "Auth", "last_name": "Test"}],
        },
    )
    assert create_res.status_code == 201
    booking_id = create_res.json()["data"]["id"]

    # 2. Unauthenticated caller attempts to pay -> 401 Unauthorized
    pay_res = await async_client.post(
        "/api/v1/payments/demo",
        json={"booking_id": booking_id, "payment_method": "DEMO_SIMULATION"},
    )
    assert pay_res.status_code == 401


@pytest.mark.asyncio
async def test_sec04_different_customer_cannot_pay_account_booking(
    async_client: AsyncClient,
    customer_headers: dict,
    other_headers: dict,
    inventory_flight: Flight,
):
    # 1. Customer A creates a booking
    create_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "user_a@example.com",
            "contact_phone": "+91 98765 00002",
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "User", "last_name": "A"}],
        },
    )
    assert create_res.status_code == 201
    booking_id = create_res.json()["data"]["id"]

    # 2. Customer B attempts to pay for Customer A's booking -> 403 Forbidden
    pay_res = await async_client.post(
        "/api/v1/payments/demo",
        headers=other_headers,
        json={"booking_id": booking_id, "payment_method": "DEMO_SIMULATION"},
    )
    assert pay_res.status_code == 403


@pytest.mark.asyncio
async def test_sec04_owner_and_admin_can_pay_booking(
    async_client: AsyncClient,
    customer_headers: dict,
    admin_headers: dict,
    inventory_flight: Flight,
):
    # Owner creates and pays
    create_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "owner@example.com",
            "contact_phone": "+91 98765 00003",
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "Owner", "last_name": "User"}],
        },
    )
    booking_id = create_res.json()["data"]["id"]

    pay_res = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={"booking_id": booking_id, "payment_method": "DEMO_SIMULATION"},
    )
    assert pay_res.status_code == 200
    assert pay_res.json()["data"]["status"] == "SUCCESS"
    assert pay_res.json()["data"]["is_demo"] is True

    # Idempotent replay by owner
    retry_res = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={"booking_id": booking_id, "payment_method": "DEMO_SIMULATION"},
    )
    assert retry_res.status_code == 200

    # Idempotent replay by admin
    admin_pay_res = await async_client.post(
        "/api/v1/payments/demo",
        headers=admin_headers,
        json={"booking_id": booking_id, "payment_method": "DEMO_SIMULATION"},
    )
    assert admin_pay_res.status_code == 200


@pytest.mark.asyncio
async def test_sec04_guest_booking_payment_authorization(
    async_client: AsyncClient,
    inventory_flight: Flight,
):
    # Unauthenticated guest creates booking
    create_res = await async_client.post(
        "/api/v1/bookings",
        json={
            "service_type": "FLIGHT",
            "guest_name": "Guest Traveler",
            "contact_email": "guest@example.com",
            "contact_phone": "+91 98765 00004",
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "Guest", "last_name": "Traveler"}],
        },
    )
    assert create_res.status_code == 201
    booking_data = create_res.json()["data"]
    booking_id = booking_data["id"]
    guest_token = booking_data["cancellation_token"]

    # 1. Attempt payment with no token -> 403 Forbidden
    no_token_pay = await async_client.post(
        "/api/v1/payments/demo",
        json={"booking_id": booking_id, "payment_method": "DEMO_SIMULATION"},
    )
    assert no_token_pay.status_code == 403

    # 2. Attempt payment with forged/invalid token -> 403 Forbidden
    bad_token_pay = await async_client.post(
        "/api/v1/payments/demo",
        json={
            "booking_id": booking_id,
            "guest_token": "fraudulent_token_12345",
            "payment_method": "DEMO_SIMULATION",
        },
    )
    assert bad_token_pay.status_code == 403

    # 3. Valid token in request body -> 200 Success
    valid_pay = await async_client.post(
        "/api/v1/payments/demo",
        json={
            "booking_id": booking_id,
            "guest_token": guest_token,
            "payment_method": "DEMO_SIMULATION",
        },
    )
    assert valid_pay.status_code == 200
    assert valid_pay.json()["data"]["status"] == "SUCCESS"


@pytest.mark.asyncio
async def test_sec04_invalid_booking_and_payment_states(
    async_client: AsyncClient,
    customer_headers: dict,
    inventory_flight: Flight,
):
    # 1. Create and confirm a booking
    create_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "state_test@example.com",
            "contact_phone": "+91 98765 00005",
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "State", "last_name": "Tester"}],
        },
    )
    booking_id = create_res.json()["data"]["id"]

    await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={"booking_id": booking_id, "payment_method": "DEMO_SIMULATION"},
    )

    # 2. Cannot retroactively simulate failure on an already confirmed booking
    fail_on_confirmed = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={
            "booking_id": booking_id,
            "payment_method": "DEMO_SIMULATION",
            "simulate_failure": True,
        },
    )
    assert fail_on_confirmed.status_code == 400
    assert "already confirmed" in fail_on_confirmed.json()["detail"].lower()

    # 3. Cancel the booking
    cancel_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers=customer_headers,
        json={"reason": "Plans changed"},
    )
    assert cancel_res.status_code == 200

    # 4. Cannot pay for an already cancelled booking
    pay_cancelled = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={"booking_id": booking_id, "payment_method": "DEMO_SIMULATION"},
    )
    assert pay_cancelled.status_code == 400
    assert "cancelled" in pay_cancelled.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Task 2: SEC-05 - Restore Inventory After Cancellation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sec05_inventory_restoration_flight_cancellation(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    inventory_flight: Flight,
):
    initial_seats = inventory_flight.available_seats

    # 1. Book 3 seats
    book_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "cancel_flight@example.com",
            "contact_phone": "+91 98765 00006",
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 3}],
            "passengers": [{"first_name": "P1", "last_name": "T"}, {"first_name": "P2", "last_name": "T"}, {"first_name": "P3", "last_name": "T"}],
        },
    )
    assert book_res.status_code == 201
    booking_id = book_res.json()["data"]["id"]

    await db_session.refresh(inventory_flight)
    assert inventory_flight.available_seats == initial_seats - 3

    # 2. Cancel booking
    cancel_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers=customer_headers,
        json={"reason": "Customer cancellation"},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["data"]["status"] == "CANCELLED"

    # 3. Inventory must be restored exactly
    await db_session.refresh(inventory_flight)
    assert inventory_flight.available_seats == initial_seats


@pytest.mark.asyncio
async def test_sec05_inventory_restoration_all_categories(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    inventory_bus: Bus,
    inventory_train: Train,
    inventory_package: HolidayPackage,
    inventory_hotel_room: HotelRoom,
):
    # Check bus restoration
    bus_init = inventory_bus.available_seats
    b_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "BUS",
            "contact_email": "bus@example.com",
            "contact_phone": "+91 99999 00001",
            "items": [{"item_type": "BUS", "item_reference_id": str(inventory_bus.id), "quantity": 2}],
            "passengers": [{"first_name": "B1", "last_name": "T"}],
        },
    )
    assert b_res.status_code == 201
    bus_bid = b_res.json()["data"]["id"]
    await db_session.refresh(inventory_bus)
    assert inventory_bus.available_seats == bus_init - 2

    await async_client.post(f"/api/v1/bookings/{bus_bid}/cancel", headers=customer_headers, json={"reason": "No travel"})
    await db_session.refresh(inventory_bus)
    assert inventory_bus.available_seats == bus_init

    # Check train restoration
    train_init = inventory_train.available_seats
    t_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "TRAIN",
            "contact_email": "train@example.com",
            "contact_phone": "+91 99999 00002",
            "items": [{"item_type": "TRAIN", "item_reference_id": str(inventory_train.id), "quantity": 4}],
            "passengers": [{"first_name": "T1", "last_name": "T"}],
        },
    )
    assert t_res.status_code == 201
    train_bid = t_res.json()["data"]["id"]
    await db_session.refresh(inventory_train)
    assert inventory_train.available_seats == train_init - 4

    await async_client.post(f"/api/v1/bookings/{train_bid}/cancel", headers=customer_headers, json={"reason": "Trip cancelled"})
    await db_session.refresh(inventory_train)
    assert inventory_train.available_seats == train_init

    # Check package restoration
    pkg_init = inventory_package.available_capacity
    p_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "PACKAGE",
            "contact_email": "pkg@example.com",
            "contact_phone": "+91 99999 00003",
            "items": [{"item_type": "PACKAGE", "item_reference_id": str(inventory_package.id), "quantity": 2}],
            "passengers": [{"first_name": "P1", "last_name": "T"}],
        },
    )
    assert p_res.status_code == 201
    pkg_bid = p_res.json()["data"]["id"]
    await db_session.refresh(inventory_package)
    assert inventory_package.available_capacity == pkg_init - 2

    await async_client.post(f"/api/v1/bookings/{pkg_bid}/cancel", headers=customer_headers, json={"reason": "Weather alert"})
    await db_session.refresh(inventory_package)
    assert inventory_package.available_capacity == pkg_init

    # Check hotel room restoration
    room_init = inventory_hotel_room.available_rooms
    h_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "HOTEL",
            "contact_email": "hotel@example.com",
            "contact_phone": "+91 99999 00004",
            "items": [{"item_type": "HOTEL_ROOM", "item_reference_id": str(inventory_hotel_room.id), "quantity": 1}],
            "passengers": [{"first_name": "H1", "last_name": "T"}],
        },
    )
    assert h_res.status_code == 201
    h_bid = h_res.json()["data"]["id"]
    await db_session.refresh(inventory_hotel_room)
    assert inventory_hotel_room.available_rooms == room_init - 1

    await async_client.post(f"/api/v1/bookings/{h_bid}/cancel", headers=customer_headers, json={"reason": "Rescheduled"})
    await db_session.refresh(inventory_hotel_room)
    assert inventory_hotel_room.available_rooms == room_init


@pytest.mark.asyncio
async def test_sec05_repeated_and_concurrent_cancellation_prevention(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    inventory_flight: Flight,
):
    init_seats = inventory_flight.available_seats

    create_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "repeat_cancel@example.com",
            "contact_phone": "+91 99999 00005",
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 2}],
            "passengers": [{"first_name": "Repeat", "last_name": "Cancel"}],
        },
    )
    booking_id = create_res.json()["data"]["id"]

    # First cancellation succeeds
    c1 = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers=customer_headers,
        json={"reason": "First cancel"},
    )
    assert c1.status_code == 200

    await db_session.refresh(inventory_flight)
    assert inventory_flight.available_seats == init_seats

    # Second cancellation attempt returns 400 Bad Request
    c2 = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers=customer_headers,
        json={"reason": "Second duplicate cancel"},
    )
    assert c2.status_code == 400

    # Seats MUST NOT be restored twice
    await db_session.refresh(inventory_flight)
    assert inventory_flight.available_seats == init_seats


# ---------------------------------------------------------------------------
# Task 3: SEC-06 - Prevent Overselling via Atomic Conditional Reservations
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sec06_oversell_rejection_returns_409(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    inventory_flight: Flight,
):
    # Set seats to exactly 2
    inventory_flight.available_seats = 2
    await db_session.commit()

    # Attempt to book 3 seats
    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "oversell@example.com",
            "contact_phone": "+91 99999 00007",
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 3}],
            "passengers": [{"first_name": "Over", "last_name": "Sell"}],
        },
    )
    assert res.status_code == 409
    assert "remaining on flight" in res.json()["detail"].lower()

    # Seats must remain unchanged and non-negative
    await db_session.refresh(inventory_flight)
    assert inventory_flight.available_seats == 2


@pytest.mark.asyncio
async def test_sec06_concurrent_booking_final_seat_contention(
    async_client: AsyncClient,
    customer_headers: dict,
    other_headers: dict,
    db_session: AsyncSession,
    inventory_flight: Flight,
):
    # Only 1 seat available
    inventory_flight.available_seats = 1
    await db_session.commit()

    # First booking claims the final remaining seat
    res1 = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "buyer1@example.com",
            "contact_phone": "+91 99999 00008",
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "Contender", "last_name": "One"}],
        },
    )
    assert res1.status_code == 201

    # Second booking attempts to claim the same seat and is rejected with 409 Conflict
    res2 = await async_client.post(
        "/api/v1/bookings",
        headers=other_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "buyer2@example.com",
            "contact_phone": "+91 99999 00009",
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "Contender", "last_name": "Two"}],
        },
    )
    assert res2.status_code == 409
    assert "remaining on flight" in res2.json()["detail"].lower()

    # Seats must be exactly 0, never negative
    await db_session.refresh(inventory_flight)
    assert inventory_flight.available_seats == 0


@pytest.mark.asyncio
async def test_sec06_multi_item_rollback_on_later_item_failure(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    inventory_flight: Flight,
    inventory_bus: Bus,
):
    init_flight_seats = inventory_flight.available_seats
    # Make bus completely full (0 seats)
    inventory_bus.available_seats = 0
    await db_session.commit()

    # Attempt a combo booking: Flight (seats available) + Bus (0 seats available)
    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "COMBO",
            "contact_email": "combo@example.com",
            "contact_phone": "+91 99999 00009",
            "items": [
                {"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1},
                {"item_type": "BUS", "item_reference_id": str(inventory_bus.id), "quantity": 1},
            ],
            "passengers": [{"first_name": "Combo", "last_name": "Traveler"}],
        },
    )
    assert res.status_code == 409
    assert "bus seats is unavailable" in res.json()["detail"].lower()

    # The flight reservation MUST be rolled back cleanly
    await db_session.refresh(inventory_flight)
    assert inventory_flight.available_seats == init_flight_seats


# ---------------------------------------------------------------------------
# Task 4: SEC-07 - Enforce Coupon Usage Limits Atomically
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sec07_coupon_usage_limit_atomic_enforcement(
    async_client: AsyncClient,
    customer_headers: dict,
    other_headers: dict,
    db_session: AsyncSession,
    inventory_flight: Flight,
):
    # 1. Create a coupon with usage_limit = 1
    code = f"SEC07LIMIT_{uuid.uuid4().hex[:6].upper()}"
    coupon = Coupon(
        code=code,
        description="Only one customer can use this",
        discount_type="FLAT",
        discount_value=500.0,
        min_order_amount=1000.0,
        usage_limit=1,
        times_used=0,
        service_type="FLIGHT",
        is_active=True,
    )
    db_session.add(coupon)
    await db_session.commit()

    # 2. First customer uses the coupon -> succeeds
    res1 = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "coupon_user1@example.com",
            "contact_phone": "+91 99999 00110",
            "promo_code": code,
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "Coupon", "last_name": "Winner"}],
        },
    )
    assert res1.status_code == 201
    assert res1.json()["data"]["discount_amount"] == 500.0

    await db_session.refresh(coupon)
    assert coupon.times_used == 1

    # 3. Second customer attempts to use the same coupon -> 409 Conflict
    res2 = await async_client.post(
        "/api/v1/bookings",
        headers=other_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "coupon_user2@example.com",
            "contact_phone": "+91 99999 00111",
            "promo_code": code,
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "Coupon", "last_name": "Late"}],
        },
    )
    assert res2.status_code == 409
    assert "maximum redemption limit" in res2.json()["detail"].lower()

    # Ensure times_used was not incremented past the limit
    await db_session.refresh(coupon)
    assert coupon.times_used == 1


@pytest.mark.asyncio
async def test_sec07_unlimited_and_restricted_coupons(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    inventory_flight: Flight,
):
    # 1. Unlimited coupon
    unlimited_code = f"UNLIMITED_{uuid.uuid4().hex[:6].upper()}"
    unlimited_coupon = Coupon(
        code=unlimited_code,
        description="No usage cap",
        discount_type="FLAT",
        discount_value=200.0,
        min_order_amount=500.0,
        usage_limit=None,
        times_used=0,
        service_type="ALL",
        is_active=True,
    )
    db_session.add(unlimited_coupon)
    await db_session.commit()

    u_res1 = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "unlim1@example.com",
            "contact_phone": "+91 99999 00112",
            "promo_code": unlimited_code,
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "U1", "last_name": "T"}],
        },
    )
    assert u_res1.status_code == 201
    assert u_res1.json()["data"]["discount_amount"] == 200.0

    u_res2 = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "unlim2@example.com",
            "contact_phone": "+91 99999 00113",
            "promo_code": unlimited_code,
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "U2", "last_name": "T"}],
        },
    )
    assert u_res2.status_code == 201
    assert u_res2.json()["data"]["discount_amount"] == 200.0

    # 2. Inactive coupon cannot receive discount
    inactive_code = f"INACTIVE_{uuid.uuid4().hex[:6].upper()}"
    inactive_coupon = Coupon(
        code=inactive_code,
        description="Not active",
        discount_type="FLAT",
        discount_value=300.0,
        usage_limit=10,
        is_active=False,
    )
    db_session.add(inactive_coupon)
    await db_session.commit()

    inact_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "inact@example.com",
            "contact_phone": "+91 99999 00114",
            "promo_code": inactive_code,
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "Inact", "last_name": "T"}],
        },
    )
    assert inact_res.status_code == 400
    assert "inactive" in inact_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_sec07_cancellation_restores_coupon_usage(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    inventory_flight: Flight,
):
    code = f"RESTORE_COUPON_{uuid.uuid4().hex[:6].upper()}"
    coupon = Coupon(
        code=code,
        description="Restored when cancelled",
        discount_type="FLAT",
        discount_value=400.0,
        min_order_amount=1000.0,
        usage_limit=1,
        times_used=0,
        service_type="FLIGHT",
        is_active=True,
    )
    db_session.add(coupon)
    await db_session.commit()

    # 1. Book with coupon
    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "coupon_cancel@example.com",
            "contact_phone": "+91 99999 00115",
            "promo_code": code,
            "items": [{"item_type": "FLIGHT", "item_reference_id": str(inventory_flight.id), "quantity": 1}],
            "passengers": [{"first_name": "Coupon", "last_name": "Canceller"}],
        },
    )
    assert res.status_code == 201
    booking_id = res.json()["data"]["id"]

    await db_session.refresh(coupon)
    assert coupon.times_used == 1

    # 2. Cancel the booking
    cancel_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers=customer_headers,
        json={"reason": "Customer cancellation"},
    )
    assert cancel_res.status_code == 200

    # 3. Verify times_used is restored back to 0
    await db_session.refresh(coupon)
    assert coupon.times_used == 0
