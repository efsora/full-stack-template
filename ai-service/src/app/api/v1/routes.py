from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.api.dependencies import get_context
from app.api.schemas.base_response import AppResponse
from app.api.schemas.response import HelloResponse
from app.core.context import Context

router = APIRouter(prefix="/api/v1", tags=["common"])

ContextDep = Annotated[Context, Depends(get_context)]


@router.get("/hello", response_model=AppResponse[HelloResponse])
async def hello(request: Request, ctx: ContextDep) -> AppResponse[HelloResponse]:
    """Health check endpoint."""
    trace_id = getattr(request.state, "trace_id", None)
    ctx.logger.info("Health check endpoint called", trace_id=trace_id)
    return AppResponse.ok(HelloResponse(message="Hello, World!"), trace_id=trace_id)
