import pytest
import uuid
from datetime import date, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.main import app
from backend.app.models.user import User, UserRole
from backend.app.models.partner import PartnerProfile, PartnerStatus, PartnerBusinessType
from backend.app.models.travel import (
    Hotel,
    HotelRoom,
    RoomDailyInventory,
    PropertyType,
    ListingPublicationStatus,
)
from backend.app.models.booking import Booking, BookingStatus
from backend.app.core.security import create_access_token, hash_password
from backend.app.core.rate_limit import limiter, get_client_ip
from backend.app.core.config import settings


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
async def verified_hotel_and_room(db_session: AsyncSession):
    """Creates a verified partner, active approved hotel, and available room."""
    uid = uuid.uuid4().hex[:8]
    partner_user = User(
        email=f"hotelier_{uid}@example.com",
        full_name="Verified Hotelier",
        phone=f"+91 98888 {uid[:5]}",
        hashed_password=hash_password("Partner123!"),
        role=UserRole.PARTNER.value,
        is_active=True,
    )
    db_session.add(partner_user)
    await db_session.commit()
    await db_session.refresh(partner_user)

    partner_profile = PartnerProfile(
        user_id=partner_user.id,
        business_name=f"Grand Horizon Group {uid}",
        business_type=PartnerBusinessType.HOTELIER.value,
        phone=partner_user.phone,
        city="Mumbai",
        status=PartnerStatus.VERIFIED.value,
        is_verified=True,
    )
    db_session.add(partner_profile)
    await db_session.commit()
    await db_session.refresh(partner_profile)

    hotel = Hotel(
        partner_id=partner_profile.id,
        name=f"Grand Horizon Luxury Suites {uid}",
        property_type=PropertyType.HOTEL.value,
        overview="Approved luxury 5-star hotel in Mumbai",
        city="Mumbai",
        country="India",
        address="100 Marine Drive",
        star_rating=5,
        guest_rating=9.0,
        review_count=120,
        starting_price=8000.0,
        currency="INR",
        featured_image="https://example.com/hotel.jpg",
        is_simulated=True,
        is_active=True,
        publication_status=ListingPublicationStatus.APPROVED.value,
    )
    db_session.add(hotel)
    await db_session.commit()
    await db_session.refresh(hotel)

    room = HotelRoom(
        hotel_id=hotel.id,
        room_type="Deluxe Sea View Suite",
        price_per_night=8000.0,
        available_rooms=5,
        is_available=True,
    )
    db_session.add(room)
    await db_session.commit()
    await db_session.refresh(room)


    return {"partner": partner_user, "hotel": hotel, "room": room}


# ---------------------------------------------------------------------------
# SEC-08: Validate hotel listing eligibility during booking
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_booking_active_approved_hotel_succeeds(
    async_client: AsyncClient,
    customer_headers: dict,
    verified_hotel_and_room: dict,
):
    """SEC-08: Booking an active, approved hotel with available room must succeed."""
    room = verified_hotel_and_room["room"]

    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "HOTEL",
            "contact_email": "traveler@example.com",
            "contact_phone": "+91 99999 00000",
            "items": [
                {
                    "item_type": "HOTEL",
                    "item_reference_id": str(room.id),
                    "quantity": 1,
                }
            ],
            "passengers": [
                {
                    "first_name": "Traveler",
                    "last_name": "One",
                    "passenger_type": "ADULT",
                }
            ],
        },
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["status"] == "PENDING"
    assert data["booking_reference"].startswith("SSJ-")


@pytest.mark.asyncio
async def test_booking_deactivated_hotel_fails_404(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    verified_hotel_and_room: dict,
):
    """SEC-08: Deactivated hotel (is_active=False) cannot be booked."""
    hotel = verified_hotel_and_room["hotel"]
    room = verified_hotel_and_room["room"]

    # Deactivate the hotel
    hotel.is_active = False
    await db_session.commit()

    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "HOTEL",
            "contact_email": "traveler@example.com",
            "contact_phone": "+91 99999 00000",
            "items": [
                {
                    "item_type": "HOTEL",
                    "item_reference_id": str(room.id),
                    "quantity": 1,
                }
            ],
            "passengers": [
                {
                    "first_name": "Traveler",
                    "last_name": "One",
                    "passenger_type": "ADULT",
                }
            ],
        },
    )
    assert res.status_code == 404
    assert "no longer available" in res.json()["detail"].lower()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "status_val",
    [
        ListingPublicationStatus.DRAFT.value,
        ListingPublicationStatus.PENDING_APPROVAL.value,
        ListingPublicationStatus.REJECTED.value,
        ListingPublicationStatus.DELISTED.value,
    ],
)
async def test_booking_unapproved_hotel_statuses_fail_404(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    verified_hotel_and_room: dict,
    status_val: str,
):
    """SEC-08: Hotel with publication status DRAFT, PENDING_APPROVAL, REJECTED, or DELISTED cannot be booked."""
    hotel = verified_hotel_and_room["hotel"]
    room = verified_hotel_and_room["room"]

    hotel.is_active = True
    hotel.publication_status = status_val
    await db_session.commit()

    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "HOTEL",
            "contact_email": "traveler@example.com",
            "contact_phone": "+91 99999 00000",
            "items": [
                {
                    "item_type": "HOTEL",
                    "item_reference_id": str(room.id),
                    "quantity": 1,
                }
            ],
            "passengers": [
                {
                    "first_name": "Traveler",
                    "last_name": "One",
                    "passenger_type": "ADULT",
                }
            ],
        },
    )
    assert res.status_code == 404
    assert "no longer available" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_booking_inactive_or_unavailable_room_fails_404(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    verified_hotel_and_room: dict,
):
    """SEC-08: Inactive or unavailable room cannot be booked."""
    room = verified_hotel_and_room["room"]

    # Mark room unavailable
    room.is_available = False
    await db_session.commit()

    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "HOTEL",
            "contact_email": "traveler@example.com",
            "contact_phone": "+91 99999 00000",
            "items": [
                {
                    "item_type": "HOTEL",
                    "item_reference_id": str(room.id),
                    "quantity": 1,
                }
            ],
            "passengers": [
                {
                    "first_name": "Traveler",
                    "last_name": "One",
                    "passenger_type": "ADULT",
                }
            ],
        },
    )
    assert res.status_code == 404
    assert "no longer available" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_direct_room_id_cannot_bypass_unapproved_hotel_status(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    verified_hotel_and_room: dict,
):
    """SEC-08: Direct room ID lookup cannot bypass parent hotel status."""
    hotel = verified_hotel_and_room["hotel"]
    room = verified_hotel_and_room["room"]

    # Change hotel to REJECTED
    hotel.publication_status = ListingPublicationStatus.REJECTED.value
    await db_session.commit()

    # Direct booking attempt using room ID
    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "HOTEL",
            "contact_email": "attacker@example.com",
            "contact_phone": "+91 99999 00000",
            "items": [
                {
                    "item_type": "HOTEL",
                    "item_reference_id": str(room.id),
                    "quantity": 1,
                }
            ],
            "passengers": [
                {
                    "first_name": "Attacker",
                    "last_name": "One",
                    "passenger_type": "ADULT",
                }
            ],
        },
    )
    assert res.status_code == 404
    assert "no longer available" in res.json()["detail"].lower()



@pytest.mark.asyncio
async def test_inventory_unchanged_after_rejected_booking(
    async_client: AsyncClient,
    customer_headers: dict,
    db_session: AsyncSession,
    verified_hotel_and_room: dict,
):
    """SEC-08: Inventory remains untouched if booking eligibility fails."""
    hotel = verified_hotel_and_room["hotel"]
    room = verified_hotel_and_room["room"]

    initial_available = room.available_rooms

    hotel.publication_status = ListingPublicationStatus.DRAFT.value
    await db_session.commit()

    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "HOTEL",
            "contact_email": "test@example.com",
            "contact_phone": "+91 99999 00000",
            "items": [
                {
                    "item_type": "HOTEL",
                    "item_reference_id": str(room.id),
                    "quantity": 1,
                }
            ],
            "passengers": [
                {
                    "first_name": "Test",
                    "last_name": "One",
                    "passenger_type": "ADULT",
                }
            ],
        },
    )
    assert res.status_code == 404

    await db_session.refresh(room)
    assert room.available_rooms == initial_available


# ---------------------------------------------------------------------------
# SEC-09: Enforce partner account status
# ---------------------------------------------------------------------------

@pytest.fixture
async def pending_partner(db_session: AsyncSession):
    uid = uuid.uuid4().hex[:8]
    user = User(
        email=f"pending_{uid}@example.com",
        full_name="Pending Partner",
        phone=f"+91 98888 {uid[:5]}",
        hashed_password=hash_password("Partner123!"),
        role=UserRole.PARTNER.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    profile = PartnerProfile(
        user_id=user.id,
        business_name=f"Pending Stays Co {uid}",
        business_type=PartnerBusinessType.HOTELIER.value,
        phone=user.phone,
        city="Pune",
        status=PartnerStatus.PENDING.value,
        is_verified=False,
    )
    db_session.add(profile)
    await db_session.commit()
    return user


@pytest.fixture
async def rejected_partner(db_session: AsyncSession):
    uid = uuid.uuid4().hex[:8]
    user = User(
        email=f"rejected_{uid}@example.com",
        full_name="Rejected Partner",
        phone=f"+91 98888 {uid[:5]}",
        hashed_password=hash_password("Partner123!"),
        role=UserRole.PARTNER.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    profile = PartnerProfile(
        user_id=user.id,
        business_name=f"Rejected Stays Co {uid}",
        business_type=PartnerBusinessType.HOMESTAY_HOST.value,
        phone=user.phone,
        city="Delhi",
        status=PartnerStatus.REJECTED.value,
        is_verified=False,
        rejection_reason="Incomplete identity documentation provided",
    )
    db_session.add(profile)
    await db_session.commit()
    return user


@pytest.fixture
async def suspended_partner(db_session: AsyncSession):
    uid = uuid.uuid4().hex[:8]
    user = User(
        email=f"suspended_{uid}@example.com",
        full_name="Suspended Partner",
        phone=f"+91 98888 {uid[:5]}",
        hashed_password=hash_password("Partner123!"),
        role=UserRole.PARTNER.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    profile = PartnerProfile(
        user_id=user.id,
        business_name=f"Suspended Stays Co {uid}",
        business_type=PartnerBusinessType.HOTELIER.value,
        phone=user.phone,
        city="Kolkata",
        status=PartnerStatus.SUSPENDED.value,
        is_verified=False,
    )
    db_session.add(profile)
    await db_session.commit()
    return user


@pytest.mark.asyncio
async def test_pending_partner_can_view_and_update_profile(
    async_client: AsyncClient,
    pending_partner: User,
):
    """SEC-09: Pending partner can view and update their profile/status."""
    token = create_access_token(subject=str(pending_partner.id), role=pending_partner.role)
    headers = {"Authorization": f"Bearer {token}"}

    res = await async_client.get("/api/v1/partner/profile", headers=headers)
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "PENDING"
    assert res.json()["data"]["is_verified"] is False

    # Update profile
    update_res = await async_client.put(
        "/api/v1/partner/profile",
        headers=headers,
        json={"business_name": "Updated Pending Stays Co"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["business_name"] == "Updated Pending Stays Co"


@pytest.mark.asyncio
async def test_pending_partner_blocked_from_properties_and_bookings(
    async_client: AsyncClient,
    pending_partner: User,
):
    """SEC-09: Pending partner cannot create properties, update inventory, or access bookings."""
    token = create_access_token(subject=str(pending_partner.id), role=pending_partner.role)
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to create a property
    prop_res = await async_client.post(
        "/api/v1/partner/properties",
        headers=headers,
        json={
            "name": "Pending Hotel",
            "property_type": "HOTEL",
            "city": "Pune",
            "price_per_night": 3000.0,
        },
    )
    assert prop_res.status_code == 403
    assert "verification required" in prop_res.json()["detail"].lower()

    # Attempt to access partner bookings
    bk_res = await async_client.get("/api/v1/partner/bookings", headers=headers)
    assert bk_res.status_code == 403
    assert "verification required" in bk_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_rejected_partner_can_view_profile_but_blocked_from_operations(
    async_client: AsyncClient,
    rejected_partner: User,
):
    """SEC-09: Rejected partner can view status & rejection notes, but is blocked from operations."""
    token = create_access_token(subject=str(rejected_partner.id), role=rejected_partner.role)
    headers = {"Authorization": f"Bearer {token}"}

    # Profile view works
    prof_res = await async_client.get("/api/v1/partner/profile", headers=headers)
    assert prof_res.status_code == 200
    data = prof_res.json()["data"]
    assert data["status"] == "REJECTED"
    assert "rejection_reason" in data

    # Creating property blocked with REJECTED reason
    prop_res = await async_client.post(
        "/api/v1/partner/properties",
        headers=headers,
        json={
            "name": "Rejected Property",
            "property_type": "HOMESTAY",
            "city": "Delhi",
            "price_per_night": 2000.0,
        },
    )
    assert prop_res.status_code == 403
    assert "rejected" in prop_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_suspended_partner_blocked_from_all_operations(
    async_client: AsyncClient,
    suspended_partner: User,
):
    """SEC-09: Suspended partner is blocked from all operations including profile retrieval."""
    token = create_access_token(subject=str(suspended_partner.id), role=suspended_partner.role)
    headers = {"Authorization": f"Bearer {token}"}

    prof_res = await async_client.get("/api/v1/partner/profile", headers=headers)
    assert prof_res.status_code == 403
    assert "suspended" in prof_res.json()["detail"].lower()

    prop_res = await async_client.post(
        "/api/v1/partner/properties",
        headers=headers,
        json={
            "name": "Suspended Hotel",
            "property_type": "HOTEL",
            "city": "Kolkata",
            "price_per_night": 5000.0,
        },
    )
    assert prop_res.status_code == 403
    assert "suspended" in prop_res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# SEC-10: Protect guest cancellation tokens
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cancellation_token_not_exposed_in_account_bookings_or_my_trips(
    async_client: AsyncClient,
    customer_headers: dict,
    admin_headers: dict,
    verified_hotel_and_room: dict,
):
    """SEC-10: Token is NOT generated or exposed in account bookings, My Trips, or Admin API."""
    room = verified_hotel_and_room["room"]

    # 1. Account-linked booking creation
    res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "HOTEL",
            "contact_email": "customer@example.com",
            "contact_phone": "+91 99999 00000",
            "items": [{"item_type": "HOTEL", "item_reference_id": str(room.id), "quantity": 1}],
            "passengers": [{"first_name": "Account", "last_name": "Holder", "passenger_type": "ADULT"}],
        },
    )
    assert res.status_code == 201
    booking_data = res.json()["data"]
    booking_id = booking_data["id"]
    # Verify token is None in creation response
    assert booking_data.get("cancellation_token") is None

    # 2. My Trips endpoint
    trips_res = await async_client.get("/api/v1/bookings/my-trips", headers=customer_headers)
    assert trips_res.status_code == 200
    trips = trips_res.json()["data"]
    match = next((t for t in trips if t["id"] == booking_id), None)
    assert match is not None
    assert match.get("cancellation_token") is None

    # 3. Admin booking list
    admin_res = await async_client.get("/api/v1/admin/bookings", headers=admin_headers)
    assert admin_res.status_code == 200
    items = admin_res.json()["data"]["items"]
    admin_match = next((b for b in items if b["id"] == booking_id), None)
    assert admin_match is not None
    assert admin_match.get("cancellation_token") is None


@pytest.mark.asyncio
async def test_guest_booking_creation_and_secure_token_workflow(
    async_client: AsyncClient,
    verified_hotel_and_room: dict,
):
    """SEC-10: Guest booking returns token only at creation; token works for lookup/cancellation."""
    room = verified_hotel_and_room["room"]

    # 1. Unauthenticated Guest Booking Creation
    res = await async_client.post(
        "/api/v1/bookings",
        json={
            "service_type": "HOTEL",
            "contact_email": "guest@example.com",
            "contact_phone": "+91 99999 88888",
            "items": [{"item_type": "HOTEL", "item_reference_id": str(room.id), "quantity": 1}],
            "passengers": [{"first_name": "Guest", "last_name": "Traveler", "passenger_type": "ADULT"}],
        },
    )
    assert res.status_code == 201
    booking_data = res.json()["data"]
    booking_id = booking_data["id"]
    guest_token = booking_data.get("cancellation_token")

    # Guest token MUST be present in initial creation response
    assert guest_token is not None
    assert len(guest_token) > 10

    # 2. Guest lookup by ID using token: token must be accepted, but response masks the token
    lookup_res = await async_client.get(
        f"/api/v1/bookings/{booking_id}",
        params={"token": guest_token},
    )
    assert lookup_res.status_code == 200
    assert lookup_res.json()["data"]["id"] == booking_id
    # Token must not be echoed back
    assert lookup_res.json()["data"].get("cancellation_token") is None

    # 3. Guest lookup without token or with invalid token must fail
    invalid_lookup = await async_client.get(
        f"/api/v1/bookings/{booking_id}",
        params={"token": "invalid_wrong_token"},
    )
    assert invalid_lookup.status_code == 403

    # 4. Guest cancellation with invalid token must fail
    bad_cancel = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        params={"token": "wrong_token_123"},
        json={"reason": "Should fail", "cancellation_token": "wrong_token_123"},
    )
    assert bad_cancel.status_code == 403

    # 5. Legitimate Guest cancellation with valid token succeeds
    good_cancel = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        params={"token": guest_token},
        json={"reason": "Legitimate change of plans", "cancellation_token": guest_token},
    )
    assert good_cancel.status_code == 200
    assert good_cancel.json()["data"]["status"] == "CANCELLED"
    # Response still masks the token
    assert good_cancel.json()["data"].get("cancellation_token") is None


# ---------------------------------------------------------------------------
# SEC-11: Add rate limiting
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_auth_login_rate_limiting_enforced(async_client: AsyncClient):
    """SEC-11: Login endpoint enforces 5 requests per minute per IP."""
    headers = {"X-Forwarded-For": "198.51.100.1"}

    # First 5 attempts should not be 429
    for i in range(5):
        res = await async_client.post(
            "/api/v1/auth/login",
            headers=headers,
            json={"email": f"user_{i}@example.com", "password": "wrongpassword"},
        )
        assert res.status_code != 429, f"Attempt {i+1} should not be rate-limited"

    # 6th attempt from the same IP MUST trigger HTTP 429
    res6 = await async_client.post(
        "/api/v1/auth/login",
        headers=headers,
        json={"email": "user_6@example.com", "password": "wrongpassword"},
    )
    assert res6.status_code == 429
    assert res6.headers.get("retry-after") == "60"
    data = res6.json()
    assert data["success"] is False
    assert "rate limit exceeded" in data["message"].lower() or "too many requests" in data["message"].lower()


@pytest.mark.asyncio
async def test_separate_ips_receive_independent_rate_limits(async_client: AsyncClient):
    """SEC-11: A different client IP is not blocked when another IP is throttled."""
    ip_a = {"X-Forwarded-For": "198.51.100.10"}
    ip_b = {"X-Forwarded-For": "198.51.100.20"}

    # Exhaust quota for IP A
    for _ in range(5):
        await async_client.post(
            "/api/v1/auth/login",
            headers=ip_a,
            json={"email": "ip_a@example.com", "password": "password"},
        )

    res_a_blocked = await async_client.post(
        "/api/v1/auth/login",
        headers=ip_a,
        json={"email": "ip_a@example.com", "password": "password"},
    )
    assert res_a_blocked.status_code == 429

    # IP B must NOT be blocked
    res_b = await async_client.post(
        "/api/v1/auth/login",
        headers=ip_b,
        json={"email": "ip_b@example.com", "password": "password"},
    )
    assert res_b.status_code == 401  # Normal credential failure, not 429


@pytest.mark.asyncio
async def test_coupon_validation_rate_limiting_enforced(async_client: AsyncClient):
    """SEC-11: Coupon validation enforces 10 requests per minute per IP."""
    headers = {"X-Forwarded-For": "198.51.100.30"}

    # First 10 validation attempts succeed or return 200/invalid response, not 429
    for i in range(10):
        res = await async_client.post(
            "/api/v1/coupons/validate",
            headers=headers,
            json={"code": f"PROMO_{i}", "service_type": "FLIGHT", "order_amount": 1000.0},
        )
        assert res.status_code != 429

    # 11th validation attempt triggers HTTP 429
    res11 = await async_client.post(
        "/api/v1/coupons/validate",
        headers=headers,
        json={"code": "PROMO_EXCESS", "service_type": "FLIGHT", "order_amount": 1000.0},
    )
    assert res11.status_code == 429
    assert res11.headers.get("retry-after") == "60"


@pytest.mark.asyncio
async def test_auth_registration_rate_limiting_enforced(async_client: AsyncClient):
    """SEC-11: Auth registration enforces 5 requests per minute per IP."""
    headers = {"X-Forwarded-For": "198.51.100.40"}

    for i in range(5):
        res = await async_client.post(
            "/api/v1/auth/register",
            headers=headers,
            json={
                "email": f"new_reg_{i}@example.com",
                "password": "ValidPassword!123",
                "full_name": f"New User {i}",
                "phone": f"+91 99990 0000{i}",
            },
        )
        assert res.status_code != 429

    # 6th attempt triggers 429
    res6 = await async_client.post(
        "/api/v1/auth/register",
        headers=headers,
        json={
            "email": "new_reg_excess@example.com",
            "password": "ValidPassword!123",
            "full_name": "New User Excess",
            "phone": "+91 99990 99999",
        },
    )
    assert res6.status_code == 429
