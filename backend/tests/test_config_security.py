import pytest
import secrets
from unittest.mock import MagicMock
from fastapi import FastAPI, Request
from httpx import AsyncClient, ASGITransport
from backend.app.core.config import Settings, INSECURE_DEV_SECRET
from backend.app.main import app, global_exception_handler


def test_settings_debug_defaults_to_false():
    """
    SEC-03: DEBUG must default to False in the Settings definition.
    """
    field_default = Settings.model_fields["DEBUG"].default
    assert field_default is False, f"Expected Settings.DEBUG default to be False, got {field_default}"


def test_production_fails_with_insecure_default_secret():
    """
    SEC-03: Startup fails in production when using the insecure development default key.
    """
    with pytest.raises(ValueError, match="Insecure or default SECRET_KEY detected"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY=INSECURE_DEV_SECRET,
        )


def test_production_fails_with_missing_secret():
    """
    SEC-03: Startup fails in production when SECRET_KEY is empty.
    """
    with pytest.raises(ValueError, match="Insecure or default SECRET_KEY detected"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="",
        )


def test_production_fails_with_short_key_material():
    """
    SEC-03: Startup fails in production when key material is less than 32 bytes.
    """
    with pytest.raises(ValueError, match=r"provides only \d+ bytes of key material"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="short_key_material",
        )


def test_production_fails_with_low_entropy_secret():
    """
    SEC-03: Startup fails when key is a trivial repetition with low entropy.
    """
    with pytest.raises(ValueError, match="exhibits low entropy"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="a" * 64,
        )


def test_production_fails_with_debug_true():
    """
    SEC-03: Startup fails if DEBUG=True in production or staging.
    """
    valid_key = secrets.token_hex(32)
    with pytest.raises(ValueError, match="DEBUG mode cannot be enabled in production"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=True,
            SECRET_KEY=valid_key,
        )


def test_staging_fails_with_insecure_secret():
    """
    SEC-03: Staging environment also enforces strict secret key security.
    """
    with pytest.raises(ValueError, match="Insecure or default SECRET_KEY detected in staging"):
        Settings(
            ENVIRONMENT="staging",
            DEBUG=False,
            SECRET_KEY=INSECURE_DEV_SECRET,
        )


def test_valid_production_configuration_succeeds():
    """
    SEC-03: A valid 32+ byte cryptographic key with DEBUG=False succeeds in production.
    """
    valid_hex_key = secrets.token_hex(32)  # 64 hex chars = 32 bytes
    cfg = Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        SECRET_KEY=valid_hex_key,
    )
    assert cfg.ENVIRONMENT == "production"
    assert cfg.DEBUG is False
    assert cfg.SECRET_KEY == valid_hex_key


@pytest.mark.asyncio
async def test_global_exception_handler_sanitizes_errors_when_debug_false(monkeypatch):
    """
    SEC-03: When DEBUG=False, internal exception details must never be returned to clients.
    """
    import json
    from backend.app.core.config import settings

    mock_request = MagicMock(spec=Request)
    sensitive_exc = RuntimeError("Database connection string: postgresql://admin:leaked_pw@db:5432/secrets")

    # Case 1: In production (DEBUG=False), error is strictly sanitized
    monkeypatch.setattr(settings, "DEBUG", False)
    prod_resp = await global_exception_handler(mock_request, sensitive_exc)
    assert prod_resp.status_code == 500
    prod_data = json.loads(prod_resp.body.decode("utf-8"))
    assert prod_data["success"] is False
    assert prod_data["detail"] == "An unexpected error occurred"
    assert "leaked_pw" not in str(prod_data)
    assert "postgresql://" not in str(prod_data)

    # Case 2: In development (DEBUG=True), debug detail is present
    monkeypatch.setattr(settings, "DEBUG", True)
    dev_resp = await global_exception_handler(mock_request, sensitive_exc)
    assert dev_resp.status_code == 500
    dev_data = json.loads(dev_resp.body.decode("utf-8"))
    assert "Database connection string" in dev_data["detail"]
