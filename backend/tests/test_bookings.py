import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.travel import Flight
from backend.app.models.user import User


@pytest.fixture
async def sample_flight(db_session: AsyncSession) -> Flight:
    flight = Flight(
        airline="ANA",
        airline_code="NH",
        flight_number="NH 801",
        aircraft="Boeing 787",
        origin_code="SFO",
        origin_name="San Francisco",
        origin_city="San Francisco",
        origin_country="USA",
        destination_code="HND",
        destination_name="Haneda",
        destination_city="Tokyo",
        destination_country="Japan",
        departure_time="10:00",
        arrival_time="16:00+1",
        duration_minutes=660,
        stops=0,
        cabin_class="ECONOMY",
        available_seats=2,  # Only 2 seats for testing inventory limits
        base_fare=50000.0,
        taxes=5000.0,
        total_price=55000.0,
        currency="INR",
        is_simulated=True,
        is_active=True,
    )
    db_session.add(flight)
    await db_session.commit()
    await db_session.refresh(flight)
    return flight


@pytest.mark.asyncio
async def test_booking_creation_and_price_calculation(
    async_client: AsyncClient,
    customer_headers: dict,
    sample_flight: Flight,
):
    # Book 1 seat with promo WANDERLUST
    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "alice@example.com",
            "contact_phone": "+91 98765 00000",
            "promo_code": "WANDERLUST",
            "has_insurance": True,
            "items": [
                {
                    "item_type": "FLIGHT",
                    "item_reference_id": str(sample_flight.id),
                    "quantity": 1,
                }
            ],
            "passengers": [
                {
                    "title": "Ms",
                    "first_name": "Alice",
                    "last_name": "Customer",
                    "passenger_type": "ADULT",
                    "gender": "FEMALE",
                }
            ],
        },
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["status"] == "PENDING"
    assert data["booking_reference"].startswith("SSJ-")
    # Base: 50000, Taxes: 5000 + 3999 (insurance) = 8999, Discount: 5000 (10% of base)
    # Total: 50000 + 8999 - 5000 = 53999
    assert data["base_amount"] == 50000.0
    assert data["discount_amount"] == 5000.0
    assert data["total_amount"] == 53999.0


@pytest.mark.asyncio
async def test_booking_inventory_oversell_prevention(
    async_client: AsyncClient,
    customer_headers: dict,
    sample_flight: Flight,
):
    # Try to book 5 seats when only 2 available
    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "alice@example.com",
            "contact_phone": "+91 98765 00000",
            "items": [
                {
                    "item_type": "FLIGHT",
                    "item_reference_id": str(sample_flight.id),
                    "quantity": 5,
                }
            ],
            "passengers": [
                {
                    "first_name": "Alice",
                    "last_name": "Smith",
                }
            ],
        },
    )
    assert res.status_code == 409
    assert "remaining" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_cancel_booking(
    async_client: AsyncClient,
    customer_headers: dict,
    sample_flight: Flight,
):
    # 1. Create a booking
    create_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "cancel_test@example.com",
            "contact_phone": "+91 98765 00000",
            "items": [
                {
                    "item_type": "FLIGHT",
                    "item_reference_id": str(sample_flight.id),
                    "quantity": 1,
                }
            ],
            "passengers": [{"first_name": "Bob", "last_name": "Smith"}],
        },
    )
    booking_id = create_res.json()["data"]["id"]

    # 2. Cancel it
    cancel_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers=customer_headers,
        json={"reason": "Change of travel plans"},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["data"]["status"] == "CANCELLED"

    # 3. Trying to cancel again fails with 400
    retry_cancel = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers=customer_headers,
        json={"reason": "Cancel again"},
    )
    assert retry_cancel.status_code == 400


@pytest.mark.asyncio
async def test_authenticated_customer_booking_and_my_trips_visibility(
    async_client: AsyncClient,
    customer_headers: dict,
    admin_headers: dict,
    test_customer: User,
    sample_flight: Flight,
):
    # 1. Customer creates a booking with real form fields
    booking_req = {
        "service_type": "FLIGHT",
        "contact_email": test_customer.email,
        "contact_phone": test_customer.phone or "+91 98765 43210",
        "has_insurance": False,
        "items": [
            {
                "item_type": "FLIGHT",
                "item_reference_id": str(sample_flight.id),
                "quantity": 1,
            }
        ],
        "passengers": [
            {
                "title": "Mr",
                "first_name": "Alice",
                "last_name": "Traveler",
                "passenger_type": "ADULT",
                "gender": "FEMALE",
                "passport_number": "P98765432",
            }
        ],
    }
    create_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json=booking_req,
    )
    assert create_res.status_code == 201
    booking_data = create_res.json()["data"]
    booking_id = booking_data["id"]
    booking_ref = booking_data["booking_reference"]

    assert booking_data["user_id"] == str(test_customer.id)
    assert booking_data["status"] == "PENDING"
    assert booking_data["contact_email"] == test_customer.email
    assert len(booking_data["passengers"]) == 1
    assert booking_data["passengers"][0]["first_name"] == "Alice"
    assert booking_data["passengers"][0]["passport_number"] == "P98765432"

    # 2. Process Demo Payment via /api/v1/payments/demo
    pay_res = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={
            "booking_id": booking_id,
            "payment_method": "CREDIT_CARD",
            "simulate_failure": False,
            "card_last_four": "4242",
        },
    )
    assert pay_res.status_code == 200
    payment_data = pay_res.json()["data"]
    assert payment_data["status"] == "SUCCESS"
    assert payment_data["is_demo"] is True

    # 3. Customer verifies booking in /api/v1/bookings/my-trips
    my_trips_res = await async_client.get(
        "/api/v1/bookings/my-trips",
        headers=customer_headers,
    )
    assert my_trips_res.status_code == 200
    trips = my_trips_res.json()["data"]
    matching_trip = next((t for t in trips if t["id"] == booking_id), None)
    assert matching_trip is not None
    assert matching_trip["booking_reference"] == booking_ref
    assert matching_trip["status"] == "CONFIRMED"
    assert matching_trip["total_amount"] > 0
    assert matching_trip["service_type"] == "FLIGHT"

    # 4. Verify same booking appears in Admin Bookings Management /api/v1/admin/bookings
    admin_bookings_res = await async_client.get(
        "/api/v1/admin/bookings",
        headers=admin_headers,
    )
    assert admin_bookings_res.status_code == 200
    admin_data = admin_bookings_res.json()["data"]
    items = admin_data["items"]
    admin_match = next((b for b in items if b["id"] == booking_id), None)
    assert admin_match is not None
    assert admin_match["booking_reference"] == booking_ref
    assert admin_match["status"] == "CONFIRMED"
    assert admin_match["contact_email"] == test_customer.email


@pytest.mark.asyncio
async def test_demo_payment_failure_simulation_and_retry(
    async_client: AsyncClient,
    customer_headers: dict,
    sample_flight: Flight,
):
    # 1. Create a booking
    create_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "failtest@example.com",
            "contact_phone": "+91 99999 11111",
            "items": [
                {
                    "item_type": "FLIGHT",
                    "item_reference_id": str(sample_flight.id),
                    "quantity": 1,
                }
            ],
            "passengers": [
                {
                    "title": "Mr",
                    "first_name": "Fail",
                    "last_name": "Tester",
                }
            ],
        },
    )
    assert create_res.status_code == 201
    booking_id = create_res.json()["data"]["id"]

    # 2. Simulate payment failure
    fail_pay_res = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={
            "booking_id": booking_id,
            "payment_method": "CREDIT_CARD",
            "simulate_failure": True,
        },
    )
    assert fail_pay_res.status_code == 200
    assert fail_pay_res.json()["data"]["status"] == "FAILED"

    # Verify booking status transitioned to FAILED
    booking_check = await async_client.get(
        f"/api/v1/bookings/{booking_id}",
        headers=customer_headers,
    )
    assert booking_check.status_code == 200
    assert booking_check.json()["data"]["status"] == "FAILED"

    # 3. Safe Retry without creating duplicate booking
    retry_pay_res = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={
            "booking_id": booking_id,
            "payment_method": "CREDIT_CARD",
            "simulate_failure": False,
        },
    )
    assert retry_pay_res.status_code == 200
    assert retry_pay_res.json()["data"]["status"] == "SUCCESS"

    confirmed_check = await async_client.get(
        f"/api/v1/bookings/{booking_id}",
        headers=customer_headers,
    )
    assert confirmed_check.json()["data"]["status"] == "CONFIRMED"


@pytest.mark.asyncio
async def test_invalid_inventory_id_fails_validation(
    async_client: AsyncClient,
    customer_headers: dict,
):
    # Non-UUID reference
    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "invalid@example.com",
            "contact_phone": "+91 99999 11111",
            "items": [
                {
                    "item_type": "FLIGHT",
                    "item_reference_id": "flight-mock-1234",
                    "quantity": 1,
                }
            ],
            "passengers": [{"first_name": "Test", "last_name": "User"}],
        },
    )
    assert res.status_code == 400
    assert "Invalid item reference ID" in res.json()["detail"]
