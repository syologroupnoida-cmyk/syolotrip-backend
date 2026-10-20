from backend.app.core.config import settings


def test_settings_defaults():
    assert settings.PROJECT_NAME is not None
    assert settings.API_V1_PREFIX == "/api/v1"
    assert settings.USE_MOCK_PROVIDERS is True
    assert len(settings.BACKEND_CORS_ORIGINS) >= 2
