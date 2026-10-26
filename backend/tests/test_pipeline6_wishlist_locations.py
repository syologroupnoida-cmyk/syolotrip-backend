import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.security import hash_password, create_access_token
from backend.app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_wishlist_unauthenticated_forbidden(async_client: AsyncClient):
    """Verify wishlist endpoints require authentication."""
    resp = await async_client.get("/api/v1/wishlist")
    assert resp.status_code == 401

    resp = await async_client.post(
        "/api/v1/wishlist",
        json={
            "id": "flight-ai-102",
            "title": "Air India 102",
            "category": "FLIGHT",
            "price": 4500.0,
        },
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_wishlist_crud_and_isolation(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
):
    """Test authenticated wishlist CRUD and multi-tenant isolation between users."""
    # 1. Add item for user 1
    item_payload = {
        "id": "flight-ai-102",
        "title": "Air India 102 DEL-BOM",
        "category": "FLIGHT",
        "location": "DEL -> BOM",
        "price": 4500.0,
        "rating": 4.5,
        "badge": "BESTSELLER",
    }
    resp = await async_client.post(
        "/api/v1/wishlist",
        json=item_payload,
        headers=customer_headers,
    )
    assert resp.status_code in (200, 201)
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["id"] == "flight-ai-102"
    assert body["data"]["title"] == "Air India 102 DEL-BOM"

    # 2. List user 1 wishlist
    resp = await async_client.get("/api/v1/wishlist", headers=customer_headers)
    assert resp.status_code == 200
    wishlist_data = resp.json()["data"]
    assert wishlist_data["count"] >= 1
    assert any(i["id"] == "flight-ai-102" for i in wishlist_data["items"])

    # 3. Create second user and verify isolation
    user2 = User(
        email="customer2@example.com",
        full_name="Bob User2",
        phone="+91 91234 56789",
        hashed_password=hash_password("Pass123!"),
        role=UserRole.CUSTOMER.value,
        is_active=True,
    )
    db_session.add(user2)
    await db_session.commit()
    await db_session.refresh(user2)

    token2 = create_access_token(subject=str(user2.id), role=user2.role)
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 2 list should be empty
    resp = await async_client.get("/api/v1/wishlist", headers=headers2)
    assert resp.status_code == 200
    assert resp.json()["data"]["items"] == []

    # User 2 trying to delete User 1's item gets removed: False
    resp = await async_client.delete("/api/v1/wishlist/flight-ai-102", headers=headers2)
    assert resp.status_code == 200
    assert resp.json()["data"]["removed"] is False

    # 4. User 1 deletes their item
    resp = await async_client.delete("/api/v1/wishlist/flight-ai-102", headers=customer_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["removed"] is True

    # List is now empty for User 1
    resp = await async_client.get("/api/v1/wishlist", headers=customer_headers)
    assert resp.status_code == 200
    assert not any(i["id"] == "flight-ai-102" for i in resp.json()["data"]["items"])


@pytest.mark.asyncio
async def test_wishlist_guest_sync_idempotent(
    async_client: AsyncClient,
    customer_headers: dict,
):
    """Test syncing guest wishlist items upon login with deduplication."""
    guest_items = {
        "items": [
            {
                "id": "hotel-paris-ritz",
                "title": "Hotel Ritz Paris",
                "category": "HOTEL",
                "location": "Paris, France",
                "price": 28000.0,
                "rating": 4.9,
            },
            {
                "id": "train-vande-bharat",
                "title": "Vande Bharat Express",
                "category": "TRAIN",
                "location": "NDLS -> BSB",
                "price": 1850.0,
            },
        ]
    }

    # First sync
    resp = await async_client.post(
        "/api/v1/wishlist/sync",
        json=guest_items,
        headers=customer_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["count"] >= 2

    # Second sync (idempotency check)
    resp2 = await async_client.post(
        "/api/v1/wishlist/sync",
        json=guest_items,
        headers=customer_headers,
    )
    assert resp2.status_code == 200
    assert resp2.json()["success"] is True

    # Clear wishlist
    resp_clear = await async_client.delete("/api/v1/wishlist", headers=customer_headers)
    assert resp_clear.status_code == 200
    assert "cleared_count" in resp_clear.json()["data"]


@pytest.mark.asyncio
async def test_locations_directory(async_client: AsyncClient):
    """Test retrieving active inventory locations directory."""
    resp = await async_client.get("/api/v1/locations")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert "airports" in data
    assert "hotel_cities" in data
    assert "train_stations" in data
    assert "bus_cities" in data
    assert "cab_cities" in data


@pytest.mark.asyncio
async def test_route_validation(async_client: AsyncClient):
    """Test route validation logic for origin/destination combinations."""
    # 1. Identical origin and destination should fail validation
    resp = await async_client.post(
        "/api/v1/locations/validate-route",
        json={
            "category": "flights",
            "origin": "DEL",
            "destination": "DEL",
        },
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["is_valid"] is False
    assert data["is_same_location"] is True
    assert "same location" in data["message"].lower()

    # 2. Case insensitive check for same location
    resp = await async_client.post(
        "/api/v1/locations/validate-route",
        json={
            "category": "buses",
            "origin": "Delhi",
            "destination": "delhi",
        },
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["is_valid"] is False
    assert data["is_same_location"] is True


@pytest.mark.asyncio
async def test_admin_dashboard_metrics(
    async_client: AsyncClient,
    admin_headers: dict,
):
    """Test admin dashboard statistics includes 6 verticals and financial reconciliation."""
    resp = await async_client.get("/api/v1/admin/overview", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    stats = body["data"]

    # All verticals
    assert "total_flights" in stats
    assert "total_hotels" in stats
    assert "total_trains" in stats
    assert "total_cabs" in stats
    assert "total_buses" in stats
    assert "total_packages" in stats

    # Financial breakdown
    assert "total_revenue" in stats
    assert "gmv_total" in stats
    assert "refunded_total" in stats
    assert isinstance(stats["gmv_total"], (int, float))
    assert isinstance(stats["refunded_total"], (int, float))
