from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "SS Journey API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "insecure-dev-secret-key-change-in-production-12345678"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # CORS origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Web app Vite default
        "http://localhost:5174",  # Admin app Vite default
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:8081",  # Customer mobile Expo
        "http://127.0.0.1:8081",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip().rstrip("/") for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip().rstrip("/") for i in v if str(i).strip()]
        elif isinstance(v, str):
            return [v.strip().rstrip("/")]
        raise ValueError(v)


    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/traveler_db"

    # Provider simulation mode
    USE_MOCK_PROVIDERS: bool = True


settings = Settings()
