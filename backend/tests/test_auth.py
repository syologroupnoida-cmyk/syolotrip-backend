import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(async_client: AsyncClient):
    res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "newcustomer@example.com",
            "full_name": "Charlie Customer",
            "password": "SecretPassword123!",
            "phone": "+91 91234 56789",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == "newcustomer@example.com"
    assert data["data"]["user"]["role"] == "CUSTOMER"
    assert "access_token" in data["data"]["tokens"]


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient):
    # Register first time
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "full_name": "Duplicate User",
            "password": "Password123!",
        },
    )
    # Register second time
    res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "full_name": "Duplicate User 2",
            "password": "Password123!",
        },
    )
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "loginuser@example.com",
            "full_name": "Login User",
            "password": "CorrectPassword123!",
        },
    )

    res = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "loginuser@example.com",
            "password": "CorrectPassword123!",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]["tokens"]


@pytest.mark.asyncio
async def test_login_incorrect_password(async_client: AsyncClient):
    res = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "testcustomer@example.com",
            "password": "WrongPassword!",
        },
    )
    assert res.status_code == 401
    assert "incorrect" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_current_user_profile(async_client: AsyncClient, customer_headers: dict):
    res = await async_client.get("/api/v1/auth/me", headers=customer_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["email"] == "testcustomer@example.com"
    assert data["data"]["role"] == "CUSTOMER"


@pytest.mark.asyncio
async def test_unauthorized_profile_access(async_client: AsyncClient):
    res = await async_client.get("/api/v1/auth/me")
    assert res.status_code == 401
