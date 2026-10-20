from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthResponse,
    UserProfileResponse,
)
from backend.app.services.auth_service import AuthService
from backend.app.api.v1.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=ApiResponse[AuthResponse], status_code=status.HTTP_201_CREATED)
async def register(
    req: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    result = await service.register(req)
    await db.commit()
    return ApiResponse(
        success=True,
        data=result,
        message="Registration successful",
    )


@router.post("/login", response_model=ApiResponse[AuthResponse])
async def login(
    req: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    result = await service.login(req)
    return ApiResponse(
        success=True,
        data=result,
        message="Login successful",
    )


@router.get("/me", response_model=ApiResponse[UserProfileResponse])
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    profile = UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat(),
    )
    return ApiResponse(
        success=True,
        data=profile,
    )
