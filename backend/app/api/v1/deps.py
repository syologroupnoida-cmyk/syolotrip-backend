import uuid
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Authenticates the bearer token and returns the active user."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload["sub"]
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    query = select(User).where(User.id == user_uuid)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user


async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Returns the authenticated user if token is provided, or None."""
    if not token:
        return None
    try:
        return await get_current_user(token=token, db=db)
    except HTTPException:
        return None


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Enforces that the current authenticated user has the ADMIN role."""
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return current_user


async def get_current_partner(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Enforces that the current authenticated user has the PARTNER role and returns their PartnerProfile."""
    from backend.app.models.partner import PartnerProfile

    if current_user.role != UserRole.PARTNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Partner access required",
        )

    query = select(PartnerProfile).where(PartnerProfile.user_id == current_user.id)
    result = await db.execute(query)
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner profile not found. Please register your partner profile.",
        )

    return profile

