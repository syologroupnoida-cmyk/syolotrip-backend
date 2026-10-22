from typing import Optional
from pydantic import BaseModel, EmailStr, Field, computed_field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

    @computed_field
    @property
    def accessToken(self) -> str:
        return self.access_token

    @computed_field
    @property
    def tokenType(self) -> str:
        return self.token_type

    @computed_field
    @property
    def expiresIn(self) -> int:
        return self.expires_in


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def fullName(self) -> str:
        return self.full_name

    @computed_field
    @property
    def isActive(self) -> bool:
        return self.is_active

    @computed_field
    @property
    def createdAt(self) -> str:
        return self.created_at


class AuthResponse(BaseModel):
    user: UserProfileResponse
    tokens: AuthTokenResponse

