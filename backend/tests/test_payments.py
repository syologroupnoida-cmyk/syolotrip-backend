import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.travel import Flight


@pytest.fixture
async def booked_flight(db_session: AsyncSession) -> Flight:
    flight = Flight(
        airline="Japan Airlines",
        airline_code="JAL",
        flight_number="JL 999",
        aircraft="Boeing 787",
        origin_code="SFO",
        origin_name="San Francisco",
        origin_city="San Francisco",
        origin_country="USA",
        destination_code="HND",
        destination_name="Haneda",
        destination_city="Tokyo",
        destination_country="Japan",
        departure_time="08:00",
        arrival_time="14:00+1",
        duration_minutes=660,
        stops=0,
        cabin_class="ECONOMY",
        available_seats=20,
        base_fare=40000.0,
        taxes=3000.0,
        total_price=43000.0,
        currency="INR",
        is_simulated=True,
        is_active=True,
    )
    db_session.add(flight)
    await db_session.commit()
    await db_session.refresh(flight)
    return flight


@pytest.mark.asyncio
async def test_demo_payment_success_and_idempotency(
    async_client: AsyncClient,
    customer_headers: dict,
    booked_flight: Flight,
):
    # 1. Create a booking
    create_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "pay_test@example.com",
            "contact_phone": "+91 98765 44444",
            "items": [
                {
                    "item_type": "FLIGHT",
                    "item_reference_id": str(booked_flight.id),
                    "quantity": 1,
                }
            ],
            "passengers": [{"first_name": "Dave", "last_name": "Traveler"}],
        },
    )
    booking_id = create_res.json()["data"]["id"]

    # 2. Process demo payment (success)
    pay_res = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={
            "booking_id": booking_id,
            "payment_method": "DEMO_SIMULATION",
            "simulate_failure": False,
        },
    )
    assert pay_res.status_code == 200
    pay_data = pay_res.json()["data"]
    assert pay_data["status"] == "SUCCESS"
    assert pay_data["is_demo"] is True

    # 3. Verify booking status transitioned to CONFIRMED
    booking_res = await async_client.get(f"/api/v1/bookings/{booking_id}", headers=customer_headers)
    assert booking_res.json()["data"]["status"] == "CONFIRMED"

    # 4. Repeated payment is safe / idempotent
    retry_pay = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={
            "booking_id": booking_id,
            "payment_method": "DEMO_SIMULATION",
            "simulate_failure": False,
        },
    )
    assert retry_pay.status_code == 200
    assert retry_pay.json()["data"]["payment_reference"] == pay_data["payment_reference"]


@pytest.mark.asyncio
async def test_demo_payment_failure_simulation(
    async_client: AsyncClient,
    customer_headers: dict,
    booked_flight: Flight,
):
    # Create booking
    create_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": "fail_pay@example.com",
            "contact_phone": "+91 98765 55555",
            "items": [
                {
                    "item_type": "FLIGHT",
                    "item_reference_id": str(booked_flight.id),
                    "quantity": 1,
                }
            ],
            "passengers": [{"first_name": "Eve", "last_name": "Traveler"}],
        },
    )
    booking_id = create_res.json()["data"]["id"]

    # Pay with simulate_failure = True
    pay_res = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={
            "booking_id": booking_id,
            "payment_method": "DEMO_SIMULATION",
            "simulate_failure": True,
        },
    )
    assert pay_res.status_code == 200
    assert pay_res.json()["data"]["status"] == "FAILED"

    # Booking must NOT be confirmed
    booking_res = await async_client.get(f"/api/v1/bookings/{booking_id}", headers=customer_headers)
    assert booking_res.json()["data"]["status"] == "FAILED"
