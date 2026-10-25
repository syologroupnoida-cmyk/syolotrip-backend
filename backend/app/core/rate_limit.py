import logging
from typing import Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    """Safely resolves client IP for rate-limiting.
    Arbitrary X-Forwarded-For headers are ignored unless request.client.host is a
    configured trusted reverse proxy.
    """
    remote_host = request.client.host if request.client else "127.0.0.1"

    trusted_proxies = set(settings.TRUSTED_PROXIES or ["127.0.0.1", "::1"])
    if remote_host in trusted_proxies:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # X-Forwarded-For format: client, proxy1, proxy2...
            # Leftmost untrusted entry is the originating client IP
            ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()]
            if ips:
                return ips[0]

    return remote_host


limiter = Limiter(
    key_func=get_client_ip,
    default_limits=[],
    storage_uri=settings.RATE_LIMIT_STORAGE_URL or "memory://",
    strategy="fixed-window",
    enabled=settings.RATE_LIMIT_ENABLED,
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Returns standard HTTP 429 response without logging credentials or payload."""
    client_ip = get_client_ip(request)
    logger.warning("Rate limit exceeded for client %s on %s", client_ip, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "success": False,
            "message": "Too many requests. Rate limit exceeded, please try again later.",
            "detail": f"Rate limit exceeded: {exc.detail}",
        },
        headers={"Retry-After": "60"},
    )
