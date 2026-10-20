import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_healthz(async_client: AsyncClient):
    response = await async_client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_api_v1_health(async_client: AsyncClient):
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "flights_provider" in data["services"]
    assert data["services"]["flights_provider"] == "mock"
