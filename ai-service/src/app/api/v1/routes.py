from fastapi import APIRouter, Request
import structlog

from app.api.schemas.base_response import AppResponse
from app.api.schemas.response import HelloResponse

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1", tags=["common"])


@router.get("/hello", response_model=AppResponse[HelloResponse])
async def hello(request: Request) -> AppResponse[HelloResponse]:
    """Health check endpoint."""
    trace_id = getattr(request.state, "trace_id", None)
    logger.info("hello_endpoint_called", trace_id=trace_id)
    return AppResponse.ok(HelloResponse(message="Hello, World!"), trace_id=trace_id)
