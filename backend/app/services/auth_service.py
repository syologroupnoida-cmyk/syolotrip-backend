import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.models.user import User, UserRole
from backend.app.repositories.user_repo import UserRepository
from backend.app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthResponse,
    UserProfileResponse,
    AuthTokenResponse,
)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register(self, req: UserRegisterRequest) -> AuthResponse:
        # Check if email already registered
        existing = await self.user_repo.get_by_email(req.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered",
            )

        hashed = hash_password(req.password)
        user = User(
            email=req.email.lower().strip(),
            full_name=req.full_name.strip(),
            phone=req.phone.strip() if req.phone else None,
            hashed_password=hashed,
            role=UserRole.CUSTOMER.value,
            is_active=True,
        )
        created_user = await self.user_repo.create(user)
        return self._build_auth_response(created_user)

    async def login(self, req: UserLoginRequest) -> AuthResponse:
        user = await self.user_repo.get_by_email(req.email)
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )


        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        return self._build_auth_response(user)

    async def demo_login(self, role: str = "CUSTOMER", custom_email: Optional[str] = None) -> AuthResponse:
        role_upper = (role or "CUSTOMER").upper().strip()
        if role_upper not in ["CUSTOMER", "ADMIN", "PARTNER"]:
            role_upper = "CUSTOMER"

        if role_upper == "ADMIN":
            target_email = custom_email or getattr(settings, "ADMIN_EMAIL", "admin@ssjourney.com")
            default_name = "Operations Admin"
            phone = "+91 98765 43210"
        elif role_upper == "PARTNER":
            target_email = custom_email or "partner@ssjourney.com"
            default_name = "Ramesh Kumar (SS Partner)"
            phone = "+91 98111 88899"
        else:
            target_email = custom_email or "customer@ssjourney.com"
            default_name = "John Doe (Demo Customer)"
            phone = "+91 98111 22233"

        user = await self.user_repo.get_by_email(target_email)
        if not user:
            user = User(
                email=target_email.lower().strip(),
                full_name=default_name,
                phone=phone,
                hashed_password=hash_password("Demo@123456"),
                role=role_upper,
                is_active=True,
                is_verified=True,
            )
            user = await self.user_repo.create(user)
        else:
            if not user.is_active:
                user.is_active = True
                await self.db.commit()
                await self.db.refresh(user)

        # For partner role, ensure verified PartnerProfile exists
        if role_upper == "PARTNER":
            from backend.app.models.partner import PartnerProfile, PartnerStatus, PartnerBusinessType
            from sqlalchemy import select
            res = await self.db.execute(select(PartnerProfile).where(PartnerProfile.user_id == user.id))
            partner_profile = res.scalar_one_or_none()
            if not partner_profile:
                partner_profile = PartnerProfile(
                    user_id=user.id,
                    business_name="SS Grand Luxury Resort & Suites",
                    business_type=PartnerBusinessType.HOTELIER.value,
                    phone=user.phone or "+91 98111 88899",
                    city="Goa",
                    address="Candolim Beach Road, North Goa",
                    country="India",
                    tax_id="30AAAAA0000A1Z5",
                    status=PartnerStatus.VERIFIED.value,
                )
                self.db.add(partner_profile)
                await self.db.commit()

        return self._build_auth_response(user)

    def _build_auth_response(self, user: User) -> AuthResponse:
        token = create_access_token(
            subject=str(user.id),
            role=user.role,
        )
        return AuthResponse(
            user=UserProfileResponse(
                id=str(user.id),
                email=user.email,
                full_name=user.full_name,
                phone=user.phone,
                role=user.role,
                is_active=user.is_active,
                created_at=user.created_at.isoformat(),
            ),
            tokens=AuthTokenResponse(
                access_token=token,
                token_type="bearer",
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            ),
        )
