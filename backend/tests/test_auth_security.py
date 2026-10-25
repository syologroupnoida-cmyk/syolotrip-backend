import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.config import settings
from backend.app.core.security import hash_password
from backend.app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_former_fallback_passwords_rejected_for_admin(async_client: AsyncClient, db_session: AsyncSession):
    """
    SEC-01 Regression Test:
    Ensures that former hardcoded fallback passwords ('Admin@123', 'Admin@123456')
    do NOT authenticate admin accounts when the stored bcrypt hash does not match.
    """
    # Create or update an admin account with a specific strong password
    admin_email = "security_test_admin@ssjourney.com"
    real_password = "ActualStrongAdminPassword!2026"
    user = User(
        email=admin_email,
        full_name="Security Admin",
        phone="+91 99999 11111",
        hashed_password=hash_password(real_password),
        role=UserRole.ADMIN.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Attempt login with former fallback bypass passwords
    for bypass_pwd in ["Admin@123", "Admin@123456", "admin", "password"]:
        res = await async_client.post(
            "/api/v1/auth/login",
            json={"email": admin_email, "password": bypass_pwd},
        )
        assert res.status_code == 401, f"Bypass password '{bypass_pwd}' must fail with 401"
        data = res.json()
        assert "detail" in data
        assert "incorrect" in data["detail"].lower()

    # Verify that the legitimate password DOES authenticate
    legit_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": admin_email, "password": real_password},
    )
    assert legit_res.status_code == 200
    assert "access_token" in legit_res.json()["data"]["tokens"]


@pytest.mark.asyncio
async def test_former_fallback_passwords_rejected_for_customer(async_client: AsyncClient, db_session: AsyncSession):
    """
    SEC-01 Regression Test:
    Ensures that former hardcoded fallback passwords ('Customer@123', 'Customer@123456')
    do NOT authenticate customer accounts when the stored bcrypt hash does not match.
    """
    cust_email = "security_test_cust@ssjourney.com"
    real_password = "ActualCustomerPassword!2026"
    user = User(
        email=cust_email,
        full_name="Security Customer",
        phone="+91 99999 22222",
        hashed_password=hash_password(real_password),
        role=UserRole.CUSTOMER.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    for bypass_pwd in ["Customer@123", "Customer@123456", "customer", "password"]:
        res = await async_client.post(
            "/api/v1/auth/login",
            json={"email": cust_email, "password": bypass_pwd},
        )
        assert res.status_code == 401
        assert "incorrect" in res.json()["detail"].lower()

    legit_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": cust_email, "password": real_password},
    )
    assert legit_res.status_code == 200


@pytest.mark.asyncio
async def test_fallback_passwords_never_work_even_with_mock_providers_and_debug(
    async_client: AsyncClient, db_session: AsyncSession, monkeypatch
):
    """
    SEC-01: Regression Test:
    Even when USE_MOCK_PROVIDERS=True and DEBUG=True, no password bypass is allowed.
    """
    monkeypatch.setattr(settings, "USE_MOCK_PROVIDERS", True)
    monkeypatch.setattr(settings, "DEBUG", True)

    target_email = "hardened_user@ssjourney.com"
    user = User(
        email=target_email,
        full_name="Hardened User",
        phone="+91 99999 33333",
        hashed_password=hash_password("SuperSecretKey!88"),
        role=UserRole.ADMIN.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    for pwd in ["Admin@123", "Admin@123456", "Customer@123", "Customer@123456"]:
        res = await async_client.post(
            "/api/v1/auth/login",
            json={"email": target_email, "password": pwd},
        )
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_inactive_user_cannot_login(async_client: AsyncClient, db_session: AsyncSession):
    """
    Verify that an inactive account cannot log in even with the correct password.
    """
    email = "inactive_admin@ssjourney.com"
    pwd = "ValidPassword123!"
    user = User(
        email=email,
        full_name="Inactive Admin",
        phone="+91 99999 44444",
        hashed_password=hash_password(pwd),
        role=UserRole.ADMIN.value,
        is_active=False,
    )
    db_session.add(user)
    await db_session.commit()

    res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    assert res.status_code == 403
    assert "inactive" in res.json()["detail"].lower()
