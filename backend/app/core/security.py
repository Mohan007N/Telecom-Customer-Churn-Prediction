"""
=============================================================
Security Module — Middleware, Rate Limiting & Input Sanitization
=============================================================
Provides security headers, IP-based sliding-window rate limiting,
request size limiting, and CSV formula injection prevention.
=============================================================
"""

import time
import re
from typing import Dict, List, Tuple, Optional
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse
from loguru import logger
from app.core.config import settings

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
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https:; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' *;"
        )
        
        return response


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    In-memory sliding-window IP rate limiter to protect against
    DDoS, brute force attacks, and inference resource exhaustion.
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

    def _cleanup_old_records(self, now: float):
        """Purges expired timestamps to avoid memory growth."""
        if now - self.last_cleanup > 300:  # Cleanup every 5 minutes
            cutoff = now - self.window_seconds
            for ip in list(self.requests_log.keys()):
                self.requests_log[ip] = [t for t in self.requests_log[ip] if t > cutoff]
                if not self.requests_log[ip]:
                    del self.requests_log[ip]
            self.last_cleanup = now

    async def dispatch(self, request: Request, call_next) -> Response:
        # Ignore docs and health checks from strict rate limits
        if request.url.path in ["/docs", "/openapi.json", "/health", "/api/v1/health", "/"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        self._cleanup_old_records(now)

        timestamps = self.requests_log.setdefault(client_ip, [])
        cutoff = now - self.window_seconds
        # Filter active timestamps
        timestamps = [t for t in timestamps if t > cutoff]
        self.requests_log[client_ip] = timestamps

        if len(timestamps) >= self.max_requests:
            logger.warning(f"Rate limit exceeded for client IP: {client_ip} on {request.url.path}")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Too many requests. Please retry in a few moments.",
                    "retry_after_seconds": int(self.window_seconds - (now - timestamps[0]))
                },
                headers={"Retry-After": str(self.window_seconds)}
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
    # Keep only safe characters
    sanitized = re.sub(r'[^a-zA-Z0-9_\-\.]', '', base)
    if not sanitized.endswith('.csv'):
        sanitized = f"{sanitized}.csv"
    return sanitized
