from __future__ import annotations

import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response as StarletteResponse
import structlog

logger = structlog.get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that logs HTTP requests and responses with structured data."""

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> StarletteResponse:
        """Process request and log with timing information.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware/handler in chain

        Returns:
            HTTP response with logging
        """
        # Get request metadata
        trace_id = getattr(request.state, "trace_id", "unknown")
        method = request.method
        path = request.url.path
        query_string = request.url.query

        # Start timing
        start_time = time.perf_counter()

        # Log request
        client_info = f" from {request.client.host}" if request.client else ""
        logger.info(
            f"{method} {path}{client_info}",
            trace_id=trace_id,
            method=method,
            path=path,
            query_string=query_string or None,
            client_host=request.client.host if request.client else None,
            client_port=request.client.port if request.client else None,
        )

        try:
            response = await call_next(request)
        except Exception as exc:
            elapsed_time = time.perf_counter() - start_time
            logger.exception(
                f"{method} {path} failed after {elapsed_time * 1000:.2f}ms: {type(exc).__name__}",
                trace_id=trace_id,
                method=method,
                path=path,
                elapsed_time_ms=elapsed_time * 1000,
                exception_type=type(exc).__name__,
            )
            raise

        # Calculate elapsed time
        elapsed_time = time.perf_counter() - start_time

        # Log response
        logger.info(
            f"{method} {path} → {response.status_code} in {elapsed_time * 1000:.2f}ms",
            trace_id=trace_id,
            method=method,
            path=path,
            status_code=response.status_code,
            elapsed_time_ms=elapsed_time * 1000,
        )

        return response
