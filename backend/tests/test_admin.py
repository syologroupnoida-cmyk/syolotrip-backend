import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_overview_forbidden_for_customers(
    async_client: AsyncClient,
    customer_headers: dict,
):
    res = await async_client.get("/api/v1/admin/overview", headers=customer_headers)
    assert res.status_code == 403
    assert "administrator" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_overview_success(
    async_client: AsyncClient,
    admin_headers: dict,
):
    res = await async_client.get("/api/v1/admin/overview", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "total_users" in data
    assert "total_bookings" in data
    assert "total_revenue" in data
    assert data["adapter_mode"] == "MOCK_DETERMINISTIC"


@pytest.mark.asyncio
async def test_admin_create_flight_listing(
    async_client: AsyncClient,
    admin_headers: dict,
):
    res = await async_client.post(
        "/api/v1/admin/flights",
        headers=admin_headers,
        json={
            "airline": "Singapore Airlines",
            "airline_code": "SQ",
            "flight_number": "SQ 888",
            "aircraft": "Airbus A350",
            "origin_code": "SIN",
            "origin_name": "Singapore Changi",
            "origin_city": "Singapore",
            "origin_country": "Singapore",
            "destination_code": "HND",
            "destination_name": "Tokyo Haneda",
            "destination_city": "Tokyo",
            "destination_country": "Japan",
            "departure_time": "14:00",
            "arrival_time": "22:00",
            "duration_minutes": 420,
            "stops": 0,
            "cabin_class": "BUSINESS",
            "available_seats": 12,
            "base_fare": 95000.0,
            "taxes": 7500.0,
            "total_price": 102500.0,
            "currency": "INR",
        },
    )
    assert res.status_code == 201
    assert res.json()["data"]["flight_number"] == "SQ 888"
