import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.models.user import User, UserRole
from backend.app.models.partner import PartnerProfile, PartnerStatus
from backend.app.core.security import hash_password, create_access_token


@pytest.fixture
async def verified_partner_user(db_session: AsyncSession) -> User:
    email = "security_test_partner@example.com"
    res = await db_session.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            full_name="Verified Partner Tester",
            phone="+91 99999 11111",
            hashed_password=hash_password("SecurePass123!"),
            role=UserRole.PARTNER.value,
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        profile = PartnerProfile(
            user_id=user.id,
            business_name="Security Test Stays",
            business_type="HOTELIER",
            phone=user.phone,
            city="New Delhi",
            status=PartnerStatus.VERIFIED.value,
            is_verified=True,
            commission_rate=0.10,
            is_commission_active=True,
        )
        db_session.add(profile)
        await db_session.commit()
    return user


@pytest.mark.asyncio
async def test_partner_login_with_correct_password(
    async_client: AsyncClient, verified_partner_user: User
):
    """Verifies that a partner can successfully log in with their correct password."""
    res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": verified_partner_user.email, "password": "SecurePass123!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "tokens" in data["data"]
    assert data["data"]["tokens"]["accessToken"] is not None
    assert data["data"]["user"]["email"] == verified_partner_user.email
    assert data["data"]["user"]["role"] == UserRole.PARTNER.value


@pytest.mark.asyncio
async def test_partner_login_with_incorrect_password(
    async_client: AsyncClient, verified_partner_user: User
):
    """CRITICAL SECURITY: Verifies that login fails when an incorrect password is provided."""
    res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": verified_partner_user.email, "password": "WrongPassword999!"},
    )
    assert res.status_code == 401
    data = res.json()
    assert "Incorrect email or password" in data["detail"]
    assert "data" not in data or data.get("data") is None


@pytest.mark.asyncio
async def test_partner_login_nonexistent_account(async_client: AsyncClient):
    """Verifies that login fails when the email does not exist."""
    res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent_partner_999@example.com", "password": "AnyPassword123!"},
    )
    assert res.status_code == 401
    assert "Incorrect email or password" in res.json()["detail"]


@pytest.mark.asyncio
async def test_partner_login_empty_credentials(async_client: AsyncClient):
    """Verifies that empty credentials are rejected by validation (422)."""
    res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "", "password": ""},
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_partner_registration_and_separate_login_cycle(async_client: AsyncClient):
    """SEC-04: Verifies the full registration workflow:
    1. Account is registered via /auth/register
    2. Partner profile registered via /partner/register
    3. Account starts as PENDING and unverified
    4. Separate login with correct password succeeds
    5. Separate login with wrong password fails
    """
    email = "new_partner_flow_test@example.com"
    pwd = "NewPartnerPass123!"

    # 1. Register Account
    reg_res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "New Partner Flow User",
            "password": pwd,
            "phone": "+91 98888 77777",
        },
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()["data"]
    temp_token = reg_data["tokens"]["accessToken"]

    # 2. Register Business Profile
    prof_res = await async_client.post(
        "/api/v1/partner/register",
        headers={"Authorization": f"Bearer {temp_token}"},
        json={
            "business_name": "Flow Test Resort",
            "business_type": "HOTELIER",
            "city": "Udaipur",
            "address": "Fateh Sagar Road",
        },
    )
    assert prof_res.status_code == 201
    prof_data = prof_res.json()["data"]
    assert prof_data["status"] == "PENDING"
    assert prof_data["is_verified"] is False

    # 3. Pending partner is barred from verified-only operations (e.g. creating properties)
    prop_res = await async_client.post(
        "/api/v1/partner/properties",
        headers={"Authorization": f"Bearer {temp_token}"},
        json={
            "name": "Unauthorized Palace",
            "property_type": "HOTEL",
            "address": "Lake Pichola",
            "city": "Udaipur",
            "starting_price": 5000,
        },
    )
    assert prop_res.status_code == 403
    assert "verification required" in prop_res.json()["detail"].lower()

    # 4. Explicit Separate Login with correct password
    login_success = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    assert login_success.status_code == 200
    assert login_success.json()["data"]["tokens"]["accessToken"] is not None

    # 5. Explicit Separate Login with incorrect password
    login_fail = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPassword!"},
    )
    assert login_fail.status_code == 401


@pytest.mark.asyncio
async def test_suspended_partner_cannot_access_portal(
    async_client: AsyncClient, db_session: AsyncSession
):
    """SEC-09: Suspended partners are blocked from all partner endpoints."""
    email = "suspended_partner@example.com"
    res = await db_session.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            full_name="Suspended Partner User",
            phone="+91 97777 66666",
            hashed_password=hash_password("Pass123!"),
            role=UserRole.PARTNER.value,
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        profile = PartnerProfile(
            user_id=user.id,
            business_name="Suspended Stays",
            business_type="HOTELIER",
            phone=user.phone,
            city="Jaipur",
            status=PartnerStatus.SUSPENDED.value,
            is_verified=False,
        )
        db_session.add(profile)
        await db_session.commit()

    token = create_access_token(subject=str(user.id), role=user.role)
    headers = {"Authorization": f"Bearer {token}"}

    res_profile = await async_client.get("/api/v1/partner/profile", headers=headers)
    assert res_profile.status_code == 403
    assert "suspended" in res_profile.json()["detail"].lower()


@pytest.mark.asyncio
async def test_partner_data_isolation(
    async_client: AsyncClient, verified_partner_user: User, db_session: AsyncSession
):
    """Verifies that Partner A cannot access or modify Partner B's properties."""
    # Create Partner B
    email_b = "partner_isolation_b@example.com"
    res = await db_session.execute(select(User).where(User.email == email_b))
    user_b = res.scalar_one_or_none()
    if not user_b:
        user_b = User(
            email=email_b,
            full_name="Partner Isolation B",
            phone="+91 95555 44444",
            hashed_password=hash_password("Pass123!"),
            role=UserRole.PARTNER.value,
            is_active=True,
        )
        db_session.add(user_b)
        await db_session.commit()
        await db_session.refresh(user_b)

        profile_b = PartnerProfile(
            user_id=user_b.id,
            business_name="Beta Secret Villa",
            business_type="HOMESTAY_HOST",
            city="Goa",
            status=PartnerStatus.VERIFIED.value,
            is_verified=True,
        )
        db_session.add(profile_b)
        await db_session.commit()

    token_b = create_access_token(subject=str(user_b.id), role=user_b.role)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Partner B creates a property
    prop_res = await async_client.post(
        "/api/v1/partner/properties",
        headers=headers_b,
        json={
            "name": "Beta Private Villa",
            "property_type": "HOMESTAY",
            "address": "Candolim Beach Road",
            "city": "Goa",
            "overview": "Luxurious private seaside villa with personal pool.",
            "featured_image": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
            "starting_price": 12000.0,
        },
    )
    assert prop_res.status_code == 201
    prop_id = prop_res.json()["data"]["id"]

    # Partner A tries to access or update Partner B's property
    token_a = create_access_token(
        subject=str(verified_partner_user.id), role=verified_partner_user.role
    )
    headers_a = {"Authorization": f"Bearer {token_a}"}

    update_res = await async_client.put(
        f"/api/v1/partner/properties/{prop_id}",
        headers=headers_a,
        json={"name": "Tampered Property Name"},
    )
    assert update_res.status_code == 404  # Scoped query returns 404 for unowned properties
