from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.schemas.health import HealthResponse, ApiResponse

router = APIRouter()


@router.get("/health", response_model=ApiResponse[HealthResponse])
async def get_health_status(db: AsyncSession = Depends(get_db)):
    db_status = "connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    health_data = HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        database=db_status,
        services={
            "flights_provider": "mock" if settings.USE_MOCK_PROVIDERS else "supplier",
            "hotels_provider": "mock" if settings.USE_MOCK_PROVIDERS else "supplier",
            "buses_provider": "mock" if settings.USE_MOCK_PROVIDERS else "supplier",
            "packages_provider": "mock" if settings.USE_MOCK_PROVIDERS else "supplier",
        },
    )

    return ApiResponse(
        success=True,
        data=health_data,
        message="System health status checked successfully",
    )
