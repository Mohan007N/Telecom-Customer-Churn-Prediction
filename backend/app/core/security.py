"""
=============================================================
Security Module — Middleware, Rate Limiting & Input Sanitization
=============================================================
Provides enterprise security headers, proxy-aware IP sliding-window
rate limiting, payload validation, and CSV formula injection prevention.
=============================================================
"""

import time
import re
from typing import Dict, List, Optional
from fastapi import Request, HTTPException, Security, status
from fastapi.security.api_key import APIKeyHeader
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse
from loguru import logger
from app.core.config import settings

api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies strict enterprise security headers to every HTTP response
    following OWASP and NIST recommendations.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent Clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Enable XSS filtering
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Enforce HTTPS transport security (1 year)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # Control referrer information leak
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Restrict browser feature permissions
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(), payment=(), usb=()"
        
        # Content Security Policy (allows necessary CDNs and API communication)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https:; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "connect-src 'self' *;"
        )
        
        return response


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    In-memory sliding-window IP rate limiter to protect against
    DDoS, brute force attacks, and inference resource exhaustion.
    Includes X-Forwarded-For support for Render and cloud load balancers.
    """
    def __init__(
        self,
        app,
        max_requests: Optional[int] = None,
        window_seconds: Optional[int] = None
    ):
        super().__init__(app)
        self.max_requests = max_requests if max_requests is not None else settings.RATE_LIMIT_MAX_REQUESTS
        self.window_seconds = window_seconds if window_seconds is not None else settings.RATE_LIMIT_WINDOW_SECONDS
        self.requests_log: Dict[str, List[float]] = {}
        self.last_cleanup = time.time()

    def _get_client_ip(self, request: Request) -> str:
        """Resolves client IP behind reverse proxies (Render, Cloudflare, AWS)."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # First IP in list is original client
            return forwarded_for.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        return request.client.host if request.client else "unknown"

    def _cleanup_old_records(self, now: float):
        """Purges expired timestamps to avoid memory growth."""
        if now - self.last_cleanup > 180:  # Cleanup every 3 minutes
            cutoff = now - self.window_seconds
            for ip in list(self.requests_log.keys()):
                self.requests_log[ip] = [t for t in self.requests_log[ip] if t > cutoff]
                if not self.requests_log[ip]:
                    del self.requests_log[ip]
            self.last_cleanup = now

    async def dispatch(self, request: Request, call_next) -> Response:
        # Bypass rate limits for health, root status, and Swagger/OpenAPI docs
        path = request.url.path
        if path in ["/docs", "/openapi.json", "/health", "/api/v1/health", "/", "/favicon.ico"]:
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        now = time.time()
        self._cleanup_old_records(now)

        timestamps = self.requests_log.setdefault(client_ip, [])
        cutoff = now - self.window_seconds
        # Filter active timestamps within the sliding window
        timestamps = [t for t in timestamps if t > cutoff]
        self.requests_log[client_ip] = timestamps

        if len(timestamps) >= self.max_requests:
            retry_after = max(1, int(self.window_seconds - (now - timestamps[0])))
            logger.warning(f"Rate limit hit for IP: {client_ip} on {path}")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Too many requests to the inference engine.",
                    "retry_after_seconds": retry_after
                },
                headers={"Retry-After": str(retry_after)}
            )

        timestamps.append(now)
        return await call_next(request)


def sanitize_csv_formula_injection(value: str) -> str:
    """
    Prevents CSV / Excel Formula Injection (DDE attacks).
    If a string cell starts with '=', '+', '-', '@', '\t', '\r',
    it is prepended with a single quote so spreadsheet programs
    treat it as literal text rather than executable macro code.
    """
    if not isinstance(value, str):
        return value
    
    val_clean = value.strip()
    if val_clean and val_clean[0] in ['=', '+', '-', '@', '\t', '\r']:
        return f"'{value}"
    return value


def sanitize_filename(filename: str) -> str:
    """
    Sanitizes filenames to prevent path traversal and arbitrary file creation.
    Allows only alphanumeric characters, underscores, hyphens, and standard extension.
    """
    base = filename.replace("\\", "/").split("/")[-1]
    sanitized = re.sub(r'[^a-zA-Z0-9_\-\.]', '', base)
    if not sanitized.endswith('.csv'):
        sanitized = f"{sanitized}.csv"
    return sanitized


async def verify_api_key(api_key: Optional[str] = Security(api_key_header)):
    """
    Optional API key dependency. If settings.API_KEY is configured,
    enforces the key header on protected routes.
    """
    if settings.API_KEY:
        if not api_key or api_key != settings.API_KEY:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid or missing API Key (X-API-KEY header required)"
            )
    return api_key
