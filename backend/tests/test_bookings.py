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
