from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.api.dependencies import get_context
from app.api.schemas.base_response import AppResponse
from app.api.schemas.errors import ErrorCode
from app.api.schemas.request import EmbedRequest, SearchRequest
from app.api.schemas.response import EmbedResponse, SearchResponse
from app.core.context import Context
from app.services.weaviate_service import WeaviateService

router = APIRouter(prefix="/api/v1/weaviate", tags=["weaviate"])

ContextDep = Annotated[Context, Depends(get_context)]
WeaviateServiceDep = Annotated[WeaviateService, Depends()]


@router.post(
    "/embed",
    response_model=AppResponse[EmbedResponse],
    status_code=status.HTTP_201_CREATED,
)
async def embed_text(
    request: Request,
    payload: EmbedRequest,
    ctx: ContextDep,
    weaviate_service: WeaviateServiceDep,
) -> AppResponse[EmbedResponse]:
    """Embed text into Weaviate vector database."""
    trace_id = getattr(request.state, "trace_id", None)
    ctx.logger.info(
        f"Embedding text into collection '{payload.collection}' ({len(payload.text)} chars)",
        trace_id=trace_id,
        collection=payload.collection,
        text_length=len(payload.text),
    )

    try:
        result = await weaviate_service.embed_text(payload.text, payload.collection)
        embed_response = EmbedResponse(
            text=result["text"],
            collection=result["collection"],
            uuid=result["uuid"],
        )
        ctx.logger.info(
            f"Text embedded successfully in '{payload.collection}': {result['uuid']}",
            trace_id=trace_id,
            collection=payload.collection,
            uuid=result["uuid"],
        )
        return AppResponse.ok(
            embed_response, message="Text embedded successfully", trace_id=trace_id
        )
    except ValueError as e:
        ctx.logger.error(
            f"Failed to embed text in '{payload.collection}': {str(e)}",
            trace_id=trace_id,
            collection=payload.collection,
            error=str(e),
        )
        return AppResponse.fail(
            code=ErrorCode.WEAVIATE_ERROR,
            message="Failed to embed text",
            detail=str(e),
            trace_id=trace_id,
        )


@router.post("/search", response_model=AppResponse[SearchResponse])
async def search_weaviate(
    request: Request,
    payload: SearchRequest,
    ctx: ContextDep,
    weaviate_service: WeaviateServiceDep,
) -> AppResponse[SearchResponse]:
    """Search for similar objects in Weaviate using BM25 search."""
    trace_id = getattr(request.state, "trace_id", None)
    ctx.logger.info(
        f"Searching in collection '{payload.collection}' for: '{payload.query}' (limit: {payload.limit})",
        trace_id=trace_id,
        collection=payload.collection,
        query=payload.query,
        limit=payload.limit,
    )

    try:
        result = await weaviate_service.search(payload.query, payload.collection, payload.limit)
        search_response = SearchResponse(
            query=result["query"],
            collection=result["collection"],
            results=result["results"],
            count=result["count"],
        )
        ctx.logger.info(
            f"Search completed in '{payload.collection}': found {result['count']} result(s)",
            trace_id=trace_id,
            collection=payload.collection,
            query=payload.query,
            results_count=result["count"],
        )
        return AppResponse.ok(search_response, message="Search completed", trace_id=trace_id)
    except ValueError as e:
        ctx.logger.error(
            f"Search failed in '{payload.collection}' for '{payload.query}': {str(e)}",
            trace_id=trace_id,
            collection=payload.collection,
            query=payload.query,
            error=str(e),
        )
        return AppResponse.fail(
            code=ErrorCode.WEAVIATE_ERROR,
            message="Failed to search",
            detail=str(e),
            trace_id=trace_id,
        )
