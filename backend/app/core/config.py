import base64
import logging
from typing import List, Optional, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("uvicorn.error")

INSECURE_DEV_SECRET = "insecure-dev-secret-key-change-in-production-12345678"
KNOWN_INSECURE_SECRETS = {
    "",
    INSECURE_DEV_SECRET,
    "change-this-in-production-to-a-secure-random-32-byte-hex",
    "secret",
    "changethis",
    "password",
    "admin",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "SS Journey API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    SECRET_KEY: str = INSECURE_DEV_SECRET
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Optional development account provisioning credentials (used only for seed.py)
    ADMIN_EMAIL: str = "admin@ssjourney.com"
    ADMIN_PASSWORD: Optional[str] = None

    # CORS origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Web app Vite default
        "http://localhost:5174",  # Admin app Vite default
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:8081",  # Customer mobile Expo
        "http://127.0.0.1:8081",
        "http://localhost:8082",  # Partner app Expo
        "http://127.0.0.1:8082",
        "http://localhost:8083",
        "http://127.0.0.1:8083",
        "http://localhost:19000",
        "http://localhost:19006",
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

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: Optional[str]) -> str:
        if not v:
            return "postgresql+asyncpg://postgres:postgres@localhost:5432/traveler_db"
        url = str(v).strip()
        # Normalize standard Render / cloud provider postgres URLs to postgresql+asyncpg://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if "sslmode=require" in url:
            url = url.replace("sslmode=require", "ssl=require")
        return url

    # Provider simulation mode
    USE_MOCK_PROVIDERS: bool = True

    # Razorpay Payment Gateway Configuration (Test Mode / Production)
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None

    # Rate Limiting & Proxy Configuration (SEC-11)
    TRUSTED_PROXIES: List[str] = ["127.0.0.1", "::1"]
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_REGISTER: str = "5/minute"
    RATE_LIMIT_COUPON_VALIDATE: str = "10/minute"
    RATE_LIMIT_STORAGE_URL: Optional[str] = None
    RATE_LIMIT_ENABLED: bool = True

    @field_validator("TRUSTED_PROXIES", mode="before")
    @classmethod
    def assemble_trusted_proxies(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip() for i in v if str(i).strip()]
        elif isinstance(v, str):
            return [v.strip()]
        return ["127.0.0.1", "::1"]

    @model_validator(mode="after")
    def validate_security_configuration(self) -> "Settings":
        env = (self.ENVIRONMENT or "development").lower().strip()
        is_production_like = env in ("production", "staging", "prod")

        secret = (self.SECRET_KEY or "").strip()

        if is_production_like:
            # 1. Enforce DEBUG=False in staging/production
            if self.DEBUG:
                raise ValueError(
                    f"CRITICAL: DEBUG mode cannot be enabled in {env} environment. "
                    "Set DEBUG=false in environment configuration."
                )

            # 2. Enforce non-default, non-empty SECRET_KEY
            if not secret or secret.lower() in KNOWN_INSECURE_SECRETS:
                raise ValueError(
                    f"CRITICAL: Insecure or default SECRET_KEY detected in {env} environment. "
                    "A cryptographically random secret of at least 32 bytes must be provided via SECRET_KEY."
                )

            # 3. Validate decoded key material length (minimum 32 bytes)
            key_bytes: bytes = b""
            # Check if key is hex-encoded (64+ hex characters)
            if len(secret) >= 64:
                try:
                    key_bytes = bytes.fromhex(secret)
                except ValueError:
                    key_bytes = b""

            # Check if key is standard base64-encoded (44+ characters)
            if not key_bytes and len(secret) >= 44:
                try:
                    key_bytes = base64.b64decode(secret, validate=True)
                except Exception:
                    key_bytes = b""

            # Fall back to raw UTF-8 bytes
            if not key_bytes:
                key_bytes = secret.encode("utf-8")

            if len(key_bytes) < 32:
                raise ValueError(
                    f"CRITICAL: SECRET_KEY provides only {len(key_bytes)} bytes of key material in {env}. "
                    "At least 32 cryptographically secure bytes are required."
                )

            # 4. Check for minimal entropy / trivial repeating character sequences
            unique_chars = len(set(secret))
            if unique_chars < 8:
                raise ValueError(
                    f"CRITICAL: SECRET_KEY exhibits low entropy (only {unique_chars} distinct characters). "
                    "Use 'secrets.token_hex(32)' to generate a cryptographically random key."
                )
        else:
            # Development/Testing audit notice
            if secret == INSECURE_DEV_SECRET:
                logger.warning(
                    "[SECURITY WARNING] Using default development SECRET_KEY. "
                    "Ensure a production-grade secret is set before deploying."
                )

        return self


settings = Settings()
