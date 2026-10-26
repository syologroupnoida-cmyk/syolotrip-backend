import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.user import User, UserRole
from backend.app.models.partner import PartnerProfile, PartnerStatus
from backend.app.core.security import create_access_token, hash_password
from sqlalchemy import select
import pytest_asyncio


@pytest_asyncio.fixture
async def partner_a(db_session: AsyncSession) -> User:
    email = "integration_partner_a@example.com"
    res = await db_session.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            full_name="Partner Alpha Integration",
            phone="+91 91111 00011",
            hashed_password=hash_password("Partner123!"),
            role=UserRole.PARTNER.value,
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        profile = PartnerProfile(
            user_id=user.id,
            business_name="Alpha Stays Integration",
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
def partner_a_headers(partner_a: User) -> dict:
    token = create_access_token(subject=str(partner_a.id), role=partner_a.role)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def partner_b(db_session: AsyncSession) -> User:
    email = "integration_partner_b@example.com"
    res = await db_session.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            full_name="Partner Beta Integration",
            phone="+91 92222 00022",
            hashed_password=hash_password("Partner123!"),
            role=UserRole.PARTNER.value,
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        profile = PartnerProfile(
            user_id=user.id,
            business_name="Beta Homestays Integration",
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
def partner_b_headers(partner_b: User) -> dict:
    token = create_access_token(subject=str(partner_b.id), role=partner_b.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio

async def test_partner_onboarding_and_verification_gate(
    async_client: AsyncClient,
    db_session: AsyncSession,
):
    """
    Verify partner onboarding flow and ensure that unverified / pending partners
    are blocked by get_verified_partner dependency with 403 Forbidden.
    """
    # 1. Register a new user
    user = User(
        email="onboarding_partner@example.com",
        full_name="Rajesh Sharma",
        phone="+91 98888 77771",
        hashed_password=hash_password("PartnerSecure!123"),
        role=UserRole.CUSTOMER.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_access_token(subject=str(user.id), role=user.role)
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Register Partner Profile (Business Onboarding)
    reg_resp = await async_client.post(
        "/api/v1/partner/register",
        headers=headers,
        json={
            "business_name": "Himalayan View Retreats",
            "business_type": "HOTELIER",
            "city": "Manali",
            "address": "Naggar Road, Manali",
            "phone": "+91 98888 77771",
            "tax_id": "02AABCH1234F1Z1",
        },
    )
    assert reg_resp.status_code == 201
    profile_data = reg_resp.json()["data"]
    assert profile_data["business_name"] == "Himalayan View Retreats"
    assert profile_data["is_verified"] is False
    assert profile_data["status"] in ["PENDING_VERIFICATION", "PENDING"]

    # 3. Verify user's profile is accessible via GET /partner/profile
    profile_resp = await async_client.get("/api/v1/partner/profile", headers=headers)
    assert profile_resp.status_code == 200
    assert profile_resp.json()["data"]["business_name"] == "Himalayan View Retreats"

    # 4. Attempt to access protected property creation while pending verification -> must return 403
    draft_resp = await async_client.post(
        "/api/v1/partner/properties",
        headers=headers,
        json={
            "name": "Unverified Hotel Draft",
            "property_type": "HOTEL",
            "star_rating": 4,
            "address": "Naggar Road",
            "city": "Manali",
            "overview": "A cozy mountain retreat",
            "starting_price": 3500.0,
            "featured_image": "https://example.com/hotel.jpg",
        },
    )
    assert draft_resp.status_code == 403
    assert "verification required" in draft_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_verified_partner_property_and_inventory_lifecycle(
    async_client: AsyncClient,
    partner_a_headers: dict,
    admin_headers: dict,
):
    """
    Full operational lifecycle for a verified partner:
    - Create property draft
    - Add room categories
    - Set daily inventory and rate overrides
    - Submit property for admin approval
    - Admin approves listing into active search
    """
    # 1. Create property draft
    prop_resp = await async_client.post(
        "/api/v1/partner/properties",
        headers=partner_a_headers,
        json={
            "name": "Cedar Wood Villa & Spa",
            "property_type": "HOTEL",
            "star_rating": 5,
            "city": "Manali",
            "address": "Aleo, Manali",
            "neighborhood": "Old Manali",
            "overview": "Luxury chalet nestled in cedar forests with valley views",
            "starting_price": 5500.0,
            "featured_image": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
            "amenities": ["Free High-Speed Wi-Fi", "Swimming Pool", "Spa & Wellness"],
        },
    )
    assert prop_resp.status_code == 201
    prop_data = prop_resp.json()["data"]
    prop_id = prop_data["id"]
    assert prop_data["publication_status"] == "DRAFT"

    # 2. Add Room Category
    room_resp = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/rooms",
        headers=partner_a_headers,
        json={
            "room_type": "Presidential Pine Suite",
            "bed_type": "1 King Bed",
            "max_occupancy": 3,
            "price_per_night": 7500.0,
            "available_rooms": 4,
            "amenities": ["Fireplace", "Private Balcony", "Jacuzzi"],
        },
    )
    assert room_resp.status_code == 201
    room_data = room_resp.json()["data"]
    room_id = room_data["id"]
    assert room_data["price_per_night"] == 7500.0

    # 3. Set Daily Inventory & Rate Override
    inv_resp = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/rooms/{room_id}/availability",
        headers=partner_a_headers,
        json={
            "date": "2026-11-20",
            "available_rooms": 2,
            "price_override": 9500.0,
            "is_blocked": False,
        },
    )
    assert inv_resp.status_code == 200
    inv_data = inv_resp.json()["data"]
    assert inv_data["date"] == "2026-11-20"
    assert inv_data["price_override"] == 9500.0

    # Retrieve daily inventory
    list_inv_resp = await async_client.get(
        f"/api/v1/partner/properties/{prop_id}/rooms/{room_id}/availability",
        headers=partner_a_headers,
    )
    assert list_inv_resp.status_code == 200
    assert len(list_inv_resp.json()["data"]) >= 1

    # 4. Submit listing for admin approval
    submit_resp = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/submit",
        headers=partner_a_headers,
    )
    assert submit_resp.status_code == 200
    assert submit_resp.json()["data"]["publication_status"] == "PENDING_APPROVAL"

    # 5. Admin approves listing
    approve_resp = await async_client.post(
        f"/api/v1/admin/properties/{prop_id}/approve",
        headers=admin_headers,
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["data"]["publication_status"] == "APPROVED"


@pytest.mark.asyncio
async def test_partner_multi_tenant_isolation(
    async_client: AsyncClient,
    partner_a_headers: dict,
    partner_b_headers: dict,
):
    """
    Verify strict isolation between Partner A and Partner B:
    - Partner B cannot view or modify Partner A's property or rooms.
    """
    # Partner A creates a listing
    p_resp = await async_client.post(
        "/api/v1/partner/properties",
        headers=partner_a_headers,
        json={
            "name": "Secret Alpha Retreat",
            "property_type": "HOMESTAY",
            "star_rating": 4,
            "city": "Goa",
            "address": "Candolim Beach Road",
            "overview": "Private villa",
            "starting_price": 4000.0,
            "featured_image": "https://example.com/villa.jpg",
        },
    )
    assert p_resp.status_code == 201
    prop_id = p_resp.json()["data"]["id"]

    # Partner B attempts to fetch Partner A's property -> 404 Not Found
    get_b_resp = await async_client.get(
        f"/api/v1/partner/properties/{prop_id}",
        headers=partner_b_headers,
    )
    assert get_b_resp.status_code == 404

    # Partner B attempts to add a room to Partner A's property -> 404 Not Found
    add_room_b_resp = await async_client.post(
        f"/api/v1/partner/properties/{prop_id}/rooms",
        headers=partner_b_headers,
        json={
            "room_type": "Intruder Suite",
            "price_per_night": 1000.0,
            "available_rooms": 1,
        },
    )
    assert add_room_b_resp.status_code == 404
