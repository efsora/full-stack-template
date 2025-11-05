from typing import Annotated, Any

from fastapi import Depends
import weaviate

from app.api.dependencies import get_context, get_weaviate_client
from app.core.context import Context
from app.db_ops.weaviate_db_ops import embed_text_in_weaviate, search_in_weaviate

ContextDep = Annotated[Context, Depends(get_context)]
WeaviateClientDep = Annotated[weaviate.WeaviateAsyncClient, Depends(get_weaviate_client)]


class WeaviateService:
    """Service layer for Weaviate operations."""

    def __init__(self, ctx: ContextDep, weaviate_client: WeaviateClientDep) -> None:
        self._ctx = ctx
        self._client = weaviate_client

    @property
    def ctx(self) -> Context:
        """Expose context for accessing logger, db_session, etc."""
        return self._ctx

    @property
    def client(self) -> weaviate.WeaviateAsyncClient:
        """Expose Weaviate client for advanced operations."""
        return self._client

    async def embed_text(self, text: str, collection: str) -> dict[str, Any]:
        """Embed text into Weaviate vector database."""
        return await embed_text_in_weaviate(self._client, text, collection)

    async def search(self, query: str, collection: str, limit: int = 10) -> dict[str, Any]:
        """Search for similar objects in Weaviate using BM25."""
        return await search_in_weaviate(self._client, query, collection, limit)
