import pytest
import asyncio
from datetime import date, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.models.user import User, UserRole
from backend.app.models.partner import PartnerProfile, PartnerStatus, PartnerBusinessType
from backend.app.models.travel import Hotel, HotelRoom, RoomDailyInventory, PropertyType, ListingPublicationStatus
from backend.app.core.security import create_access_token, hash_password


@pytest.fixture
async def partner_a(db_session: AsyncSession) -> User:
    email = "partner_a@example.com"
    res = await db_session.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            full_name="Partner Alpha",
            phone="+91 91111 00001",
            hashed_password=hash_password("Partner123!"),
            role=UserRole.PARTNER.value,
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        profile = PartnerProfile(
            user_id=user.id,
            business_name="Alpha Stays Pvt Ltd",
            business_type="HOTELIER",
            phone=user.phone,
            city="Manali",
            status=PartnerStatus.VERIFIED.value,
            is_verified=True,
        )
        db_session.add(profile)
        await db_session.commit()
    return user


@pytest.fixture
async def partner_b(db_session: AsyncSession) -> User:
    email = "partner_b@example.com"
    res = await db_session.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            full_name="Partner Beta",
            phone="+91 92222 00002",
            hashed_password=hash_password("Partner123!"),
            role=UserRole.PARTNER.value,
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        profile = PartnerProfile(
            user_id=user.id,
            business_name="Beta Homestays",
            business_type="HOMESTAY_HOST",
            phone=user.phone,
            city="Goa",
            status=PartnerStatus.VERIFIED.value,
            is_verified=True,
        )
        db_session.add(profile)
        await db_session.commit()
    return user


@pytest.fixture
def partner_a_headers(partner_a: User) -> dict:
    token = create_access_token(subject=str(partner_a.id), role=partner_a.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def partner_b_headers(partner_b: User) -> dict:
    token = create_access_token(subject=str(partner_b.id), role=partner_b.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_partner_registration_flow(
    async_client: AsyncClient,
    db_session: AsyncSession,
):
    # Register a new customer first
    user = User(
        email="newpartner@example.com",
        full_name="Charlie New Partner",
        phone="+91 93333 00003",
        hashed_password=hash_password("Pass123!"),
        role=UserRole.CUSTOMER.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_access_token(subject=str(user.id), role=user.role)
    headers = {"Authorization": f"Bearer {token}"}

    # Register as partner
    reg_res = await async_client.post(
        "/api/v1/partner/register",
        headers=headers,
        json={
            "business_name": "Charlie Retreats",
            "business_type": "HOMESTAY_HOST",
            "phone": "+91 93333 00003",
            "address": "123 Beach Road",
            "city": "Goa",
        },
    )
    assert reg_res.status_code == 201
    data = reg_res.json()["data"]
    assert data["business_name"] == "Charlie Retreats"
    assert data["business_type"] == "HOMESTAY_HOST"
    assert data["status"] in ["PENDING", "VERIFIED"]

    # Verify user profile endpoint
    profile_res = await async_client.get("/api/v1/partner/profile", headers=headers)
    assert profile_res.status_code == 200
    assert profile_res.json()["data"]["business_name"] == "Charlie Retreats"


@pytest.mark.asyncio
async def test_partner_property_draft_and_public_search_isolation(
    async_client: AsyncClient,
    partner_a_headers: dict,
    admin_headers: dict,
):
    # 1. Partner creates a hotel draft
    create_res = await async_client.post(
        "/api/v1/partner/properties",
        headers=partner_a_headers,
        json={
            "name": "Alpha Mountain Lodge",
            "property_type": "HOTEL",
            "city": "Manali",
            "country": "India",
            "address": "Hadimba Road",
            "star_rating": 4,
            "overview": "Scenic alpine resort with magnificent valley views.",
            "featured_image": "https://images.unsplash.com/photo-mountain-lodge",
            "images": ["https://images.unsplash.com/photo-mountain-lodge"],
            "amenities": ["WiFi", "Heater", "Breakfast"],
            "starting_price": 4500.0,
        },
    )
    assert create_res.status_code == 201
    prop = create_res.json()["data"]
    prop_id = prop["id"]
    assert prop["publication_status"] == "DRAFT"
    assert prop["property_type"] == "HOTEL"

    # 2. Add a room to the property
    room_res = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/rooms",
        headers=partner_a_headers,
        json={
            "room_type": "Deluxe Alpine Room",
            "bed_type": "1 King Bed",
            "max_occupancy": 2,
            "price_per_night": 4500.0,
            "taxes_per_night": 540.0,
            "available_rooms": 10,
            "amenities": ["Balcony", "Free WiFi"],
        },
    )
    assert room_res.status_code == 201
    assert room_res.json()["data"]["room_type"] == "Deluxe Alpine Room"

    # 3. Check public search: DRAFT property MUST NOT appear
    search_res = await async_client.get("/api/v1/hotels", params={"city": "Manali"})
    assert search_res.status_code == 200
    names = [h["name"] for h in search_res.json()["data"]["items"]]
    assert "Alpha Mountain Lodge" not in names

    # 4. Check direct public lookup by ID: MUST return 404
    detail_res = await async_client.get(f"/api/v1/hotels/{prop_id}")
    assert detail_res.status_code == 404

    # 5. Partner submits for approval
    submit_res = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/submit",
        headers=partner_a_headers,
    )
    assert submit_res.status_code == 200
    assert submit_res.json()["data"]["publication_status"] == "PENDING_APPROVAL"

    # 6. Still NOT visible publicly while PENDING_APPROVAL
    search_res2 = await async_client.get("/api/v1/hotels", params={"city": "Manali"})
    assert "Alpha Mountain Lodge" not in [h["name"] for h in search_res2.json()["data"]["items"]]
    assert (await async_client.get(f"/api/v1/hotels/{prop_id}")).status_code == 404

    # 7. Admin sees pending property in admin queue
    admin_pending_res = await async_client.get(
        "/api/v1/admin/properties/pending",
        headers=admin_headers,
    )
    assert admin_pending_res.status_code == 200
    pending_ids = [p["id"] for p in admin_pending_res.json()["data"]]
    assert prop_id in pending_ids

    # 8. Admin approves the property
    approve_res = await async_client.post(
        f"/api/v1/admin/properties/{prop_id}/approve",
        headers=admin_headers,
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["data"]["publication_status"] == "APPROVED"
    assert approve_res.json()["data"]["approved_at"] is not None

    # 9. Now it IS visible in public search and direct lookup!
    search_res3 = await async_client.get("/api/v1/hotels", params={"city": "Manali"})
    assert search_res3.status_code == 200
    approved_names = [h["name"] for h in search_res3.json()["data"]["items"]]
    assert "Alpha Mountain Lodge" in approved_names

    direct_res = await async_client.get(f"/api/v1/hotels/{prop_id}")
    assert direct_res.status_code == 200
    assert direct_res.json()["data"]["name"] == "Alpha Mountain Lodge"
    assert len(direct_res.json()["data"]["rooms"]) >= 1


@pytest.mark.asyncio
async def test_admin_rejection_workflow(
    async_client: AsyncClient,
    partner_a_headers: dict,
    admin_headers: dict,
):
    # Create and submit a homestay
    create_res = await async_client.post(
        "/api/v1/partner/properties",
        headers=partner_a_headers,
        json={
            "name": "Alpha Riverside Cottage",
            "property_type": "HOMESTAY",
            "city": "Rishikesh",
            "country": "India",
            "address": "Ganges Riverfront",
            "star_rating": 3,
            "overview": "Riverside serene cottage right beside the holy Ganges.",
            "featured_image": "https://images.unsplash.com/photo-cottage",
            "starting_price": 2800.0,
        },
    )
    prop_id = create_res.json()["data"]["id"]
    await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/submit",
        headers=partner_a_headers,
    )

    # Admin rejects with feedback
    reject_res = await async_client.post(
        f"/api/v1/admin/properties/{prop_id}/reject",
        headers=admin_headers,
        json={"rejection_reason": "High-resolution facade photos and fire safety certificate required."},
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["data"]["publication_status"] == "REJECTED"
    assert "fire safety certificate" in reject_res.json()["data"]["admin_rejection_reason"]

    # Must NOT be in public search
    search_res = await async_client.get("/api/v1/hotels", params={"city": "Rishikesh"})
    assert "Alpha Riverside Cottage" not in [h["name"] for h in search_res.json()["data"]["items"]]


@pytest.mark.asyncio
async def test_partner_ownership_isolation(
    async_client: AsyncClient,
    partner_a_headers: dict,
    partner_b_headers: dict,
):
    # Partner A creates a property
    create_res = await async_client.post(
        "/api/v1/partner/properties",
        headers=partner_a_headers,
        json={
            "name": "Confidential Alpha Resort",
            "property_type": "HOTEL",
            "city": "Udaipur",
            "country": "India",
            "address": "Lake Palace Road",
            "overview": "Luxury heritage boutique property.",
            "featured_image": "https://images.unsplash.com/photo-resort",
            "starting_price": 12000.0,
        },
    )
    prop_id = create_res.json()["data"]["id"]

    # Partner B attempts to read Partner A's property
    read_res = await async_client.get(
        f"/api/v1/partner/properties/{prop_id}",
        headers=partner_b_headers,
    )
    assert read_res.status_code in [403, 404]

    # Partner B attempts to edit Partner A's property
    update_res = await async_client.put(
        f"/api/v1/partner/properties/{prop_id}",
        headers=partner_b_headers,
        json={"name": "Hacked Property Name"},
    )
    assert update_res.status_code in [403, 404]

    # Partner B attempts to add a room to Partner A's property
    room_res = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/rooms",
        headers=partner_b_headers,
        json={
            "room_type": "Sneaky Room",
            "price_per_night": 100.0,
            "available_rooms": 1,
        },
    )
    assert room_res.status_code in [403, 404]

    # Partner B attempts to submit Partner A's property
    submit_res = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/submit",
        headers=partner_b_headers,
    )
    assert submit_res.status_code in [403, 404]


@pytest.mark.asyncio
async def test_daily_inventory_management(
    async_client: AsyncClient,
    partner_a_headers: dict,
):
    # 1. Create property and room
    create_res = await async_client.post(
        "/api/v1/partner/properties",
        headers=partner_a_headers,
        json={
            "name": "Inventory Test Inn",
            "property_type": "HOTEL",
            "city": "Jaipur",
            "country": "India",
            "address": "MI Road",
            "overview": "Historic city center hotel.",
            "featured_image": "https://images.unsplash.com/photo-inn",
            "starting_price": 5000.0,
        },
    )
    prop_id = create_res.json()["data"]["id"]

    room_res = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/rooms",
        headers=partner_a_headers,
        json={
            "room_type": "Royal Suite",
            "price_per_night": 5000.0,
            "available_rooms": 5,
        },
    )
    room_id = room_res.json()["data"]["id"]

    target_date = (date.today() + timedelta(days=7)).isoformat()

    # 2. Set daily inventory override for target_date
    inv_res = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/rooms/{room_id}/inventory",
        headers=partner_a_headers,
        json={
            "date": target_date,
            "available_rooms": 2,
            "price_override": 7500.0,
            "is_blocked": False,
        },
    )
    assert inv_res.status_code == 200
    inv_data = inv_res.json()["data"]
    assert inv_data["available_rooms"] == 2
    assert inv_data["price_override"] == 7500.0

    # 3. Retrieve daily inventory list
    list_inv = await async_client.get(
        f"/api/v1/partner/properties/{prop_id}/rooms/{room_id}/inventory",
        headers=partner_a_headers,
        params={
            "start_date": (date.today()).isoformat(),
            "end_date": (date.today() + timedelta(days=14)).isoformat(),
        },
    )
    assert list_inv.status_code == 200
    records = list_inv.json()["data"]
    assert any(r["date"] == target_date and r["available_rooms"] == 2 for r in records)


@pytest.mark.asyncio
async def test_guest_booking_security_and_cancellation_token(
    async_client: AsyncClient,
    admin_headers: dict,
    partner_a_headers: dict,
):
    # Create and approve a hotel with 1 room
    prop_res = await async_client.post(
        "/api/v1/partner/properties",
        headers=partner_a_headers,
        json={
            "name": "Security Test Villa",
            "property_type": "HOMESTAY",
            "city": "Ooty",
            "country": "India",
            "address": "Tea Estate Hill",
            "overview": "Peaceful homestay amidst tea plantations.",
            "featured_image": "https://images.unsplash.com/photo-villa",
            "starting_price": 3000.0,
        },
    )
    prop_id = prop_res.json()["data"]["id"]
    room_res = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/rooms",
        headers=partner_a_headers,
        json={
            "room_type": "Valley Villa",
            "price_per_night": 3000.0,
            "taxes_per_night": 360.0,
            "available_rooms": 2,
        },
    )
    room_id = room_res.json()["data"]["id"]

    await async_client.post(f"/api/v1/partner/properties/{prop_id}/submit", headers=partner_a_headers)
    await async_client.post(f"/api/v1/admin/properties/{prop_id}/approve", headers=admin_headers)

    # 1. Create a guest booking (NO Authorization header)
    check_in = (date.today() + timedelta(days=10)).isoformat()
    check_out = (date.today() + timedelta(days=12)).isoformat()

    booking_res = await async_client.post(
        "/api/v1/bookings",
        json={
            "service_type": "HOTEL",
            "contact_email": "guest_traveler@example.com",
            "contact_phone": "+91 99999 12345",
            "check_in_date": check_in,
            "check_out_date": check_out,
            "items": [
                {
                    "item_type": "HOTEL",
                    "item_reference_id": room_id,
                    "quantity": 1,
                    "hotel_id": prop_id,
                    "room_id": room_id,
                    "check_in_date": check_in,
                    "check_out_date": check_out,
                }
            ],
            "passengers": [
                {"first_name": "John", "last_name": "Guest"}
            ],
        },
    )
    assert booking_res.status_code == 201
    booking_data = booking_res.json()["data"]
    booking_id = booking_data["id"]
    token = booking_data.get("cancellation_token")
    assert token is not None and len(token) > 10

    # 2. Unauthorized attempt to inspect booking without token
    anon_view = await async_client.get(f"/api/v1/bookings/{booking_id}")
    assert anon_view.status_code == 403

    # 3. View with invalid token -> 403 Forbidden
    fake_token_view = await async_client.get(
        f"/api/v1/bookings/{booking_id}",
        params={"token": "invalid_fake_token_123"},
    )
    assert fake_token_view.status_code == 403

    # 4. View with valid query token -> 200 OK
    valid_view = await async_client.get(
        f"/api/v1/bookings/{booking_id}",
        params={"token": token},
    )
    assert valid_view.status_code == 200
    assert valid_view.json()["data"]["id"] == booking_id

    # 5. Cancel without token -> 403 Forbidden
    anon_cancel = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        json={"reason": "Unauthorized attacker trying to cancel"},
    )
    assert anon_cancel.status_code == 403

    # 6. Cancel with header X-Booking-Token -> 200 OK
    auth_cancel = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers={"X-Booking-Token": token},
        json={"reason": "Guest plans changed"},
    )
    assert auth_cancel.status_code == 200
    assert auth_cancel.json()["data"]["status"] == "CANCELLED"


@pytest.mark.asyncio
async def test_room_booking_inventory_concurrency(
    async_client: AsyncClient,
    admin_headers: dict,
    partner_a_headers: dict,
):
    # Setup property with exactly 1 available room
    prop_res = await async_client.post(
        "/api/v1/partner/properties",
        headers=partner_a_headers,
        json={
            "name": "Single Room Haven",
            "property_type": "HOTEL",
            "city": "Coorg",
            "country": "India",
            "address": "Coffee Plantation Road",
            "overview": "Exclusive 1-room hideaway.",
            "featured_image": "https://images.unsplash.com/photo-single",
            "starting_price": 2500.0,
        },
    )
    prop_id = prop_res.json()["data"]["id"]
    room_res = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/rooms",
        headers=partner_a_headers,
        json={
            "room_type": "Solo Suite",
            "price_per_night": 2500.0,
            "available_rooms": 1,
        },
    )
    room_id = room_res.json()["data"]["id"]

    await async_client.post(f"/api/v1/partner/properties/{prop_id}/submit", headers=partner_a_headers)
    await async_client.post(f"/api/v1/admin/properties/{prop_id}/approve", headers=admin_headers)

    booking_payload = {
        "service_type": "HOTEL",
        "contact_email": "racer@example.com",
        "contact_phone": "+91 99999 55555",
        "items": [
            {
                "item_type": "HOTEL",
                "item_reference_id": room_id,
                "quantity": 1,
                "hotel_id": prop_id,
                "room_id": room_id,
            }
        ],
        "passengers": [{"first_name": "Racer", "last_name": "One"}],
    }

    # 1. Try to book 2 rooms when only 1 is available -> 409 Conflict
    excess_payload = dict(booking_payload)
    excess_payload["items"] = [
        {
            "item_type": "HOTEL",
            "item_reference_id": room_id,
            "quantity": 2,
            "hotel_id": prop_id,
            "room_id": room_id,
        }
    ]
    excess_res = await async_client.post("/api/v1/bookings", json=excess_payload)
    assert excess_res.status_code == 409
    assert "unavailable" in excess_res.json()["detail"].lower()

    # 2. Book the single available room -> 201 Created
    res1 = await async_client.post("/api/v1/bookings", json=booking_payload)
    assert res1.status_code == 201
    assert res1.json()["data"]["status"] == "PENDING"

    # 3. Attempting to book again when 0 available rooms remain -> 409 Conflict
    res2 = await async_client.post("/api/v1/bookings", json=booking_payload)
    assert res2.status_code == 409
    assert "unavailable" in res2.json()["detail"].lower()
