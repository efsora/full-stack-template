from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any, cast
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response as SstarletteResponse

from app.api.schemas.base_response import AppResponse, FieldError
from app.api.schemas.errors import ErrorCode
from app.api.v1 import routes, user_routes, weaviate_routes
from app.core.exceptions import AppException
from app.core.logging import get_logger, setup_logging
from app.core.settings import Settings
from app.core.version import APP_NAME, APP_VERSION
from app.dependency_injection.container import Container
from app.infrastructure.db.schema import metadata
from app.middleware.logging import RequestLoggingMiddleware

logger = get_logger(__name__)


class TraceIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> SstarletteResponse:
        request.state.trace_id = uuid.uuid4().hex
        response = await call_next(request)
        response.headers["X-Trace-Id"] = request.state.trace_id
        return response


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    container = Container()

    cast(Any, app.state).container = container

    settings: Settings = container.settings()

    # Initialize logging
    setup_logging(settings)
    logger.info(
        f"Starting {APP_NAME} v{APP_VERSION} in {settings.ENV} environment",
        app_name=APP_NAME,
        app_version=APP_VERSION,
        env=settings.ENV,
    )

    engine = container.engine()

    # Auto-create tables in dev, but NOT in test (conftest handles test_schema creation)
    if settings.ENV == "dev":
        async with engine.begin() as conn:
            await conn.run_sync(metadata.create_all)
        logger.debug(f"Database tables created for {settings.ENV} environment", env=settings.ENV)

    # Wire at runtime
    container.wire(
        modules=[
            "app.api.v1.routes",
            "app.api.v1.user_routes",
            "app.api.v1.weaviate_routes",
            "app.api.dependencies",
            "app.services.user_service",
            "app.services.weaviate_service",
        ]
    )

    logger.info("Dependency injection container wired successfully")

    # Connect Weaviate client
    weaviate_client = container.weaviate_client()
    try:
        await weaviate_client.connect()
        logger.debug("Weaviate async client connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to Weaviate: {str(e)}", error=str(e))
        raise

    try:
        yield
    finally:
        logger.info("Shutting down application")
        # Close Weaviate client
        try:
            await weaviate_client.close()
            logger.debug("Weaviate async client closed successfully")
        except Exception as e:
            logger.error(f"Error closing Weaviate client: {str(e)}", error=str(e))
        # Dispose database engine
        await engine.dispose()
        container.unwire()


def create_app() -> FastAPI:
    app = FastAPI(
        title=APP_NAME,
        version=APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )
    register_exception_handlers(app)
    # Include all routers
    app.include_router(routes.router)
    app.include_router(user_routes.router)
    app.include_router(weaviate_routes.router)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(TraceIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],  # example domain
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app


def format_validation_location(parts: tuple[object, ...]) -> str:
    formatted: list[str] = []
    for part in parts:
        if part in {"body", "query", "path"} and not formatted:
            continue
        if isinstance(part, int):
            if formatted:
                formatted[-1] = f"{formatted[-1]}[{part}]"
            else:
                formatted.append(f"[{part}]")
        else:
            formatted.append(str(part))
    return ".".join(p for p in formatted if p)


async def request_validation_error_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    if not isinstance(exc, RequestValidationError):
        raise exc
    errors = [
        FieldError(
            field=format_validation_location(tuple(err.get("loc", ()))),
            reason=err.get("msg", ""),
        )
        for err in exc.errors()
    ]
    trace_id = getattr(request.state, "trace_id", None)
    logger.warning(
        f"Validation error on {request.url.path}: {len(errors)} error(s)",
        trace_id=trace_id,
        path=request.url.path,
        errors_count=len(errors),
    )
    body = AppResponse.fail(
        code=ErrorCode.VALIDATION_ERROR,
        message="Request validation failed",
        detail="Please inspect the `errors` array for field-level details.",
        errors=errors,
        trace_id=trace_id,
    )
    return JSONResponse(status_code=422, content=body.model_dump(mode="json"))


async def http_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    if not isinstance(exc, HTTPException):
        raise exc
    detail_payload: str | dict[str, Any] | list[Any] | None
    message: str
    if isinstance(exc.detail, str):
        message = exc.detail
        detail_payload = exc.detail
    elif isinstance(exc.detail, dict):
        message = exc.detail.get("message", "HTTP Error")
        detail_payload = exc.detail
    elif isinstance(exc.detail, list):
        message = "HTTP Error"
        detail_payload = exc.detail
    else:
        message = "HTTP Error"
        detail_payload = None
    trace_id = getattr(request.state, "trace_id", None)
    logger.warning(
        f"HTTP {exc.status_code} on {request.url.path}: {message}",
        trace_id=trace_id,
        status_code=exc.status_code,
        path=request.url.path,
        message=message,
    )
    body = AppResponse.fail(
        code=ErrorCode.HTTP_ERROR,
        message=message,
        detail=detail_payload,
        trace_id=trace_id,
    )
    return JSONResponse(status_code=exc.status_code, content=body.model_dump(mode="json"))


async def app_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    if not isinstance(exc, AppException):
        raise exc
    errors = [FieldError(field=field, reason=reason) for field, reason in exc.errors]
    trace_id = getattr(request.state, "trace_id", None)
    logger.error(
        f"Application error [{exc.code.value}] on {request.url.path}: {exc.message}",
        trace_id=trace_id,
        status_code=exc.status_code,
        path=request.url.path,
        error_code=exc.code.value,
        message=exc.message,
    )
    body = AppResponse.fail(
        code=exc.code,
        message=exc.message,
        detail=exc.detail,
        errors=errors,
        trace_id=trace_id,
    )
    return JSONResponse(status_code=exc.status_code, content=body.model_dump(mode="json"))


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, request_validation_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(AppException, app_exception_handler)


app = create_app()
