from collections.abc import AsyncGenerator
from typing import Annotated, Any, cast

from dependency_injector.wiring import Provide, inject
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
import weaviate

from app.core.context import Context
from app.dependency_injection.container import Container


@inject
async def get_session(
    session_factory: Annotated[Any, Depends(Provide[Container.session_factory])],
) -> AsyncGenerator[AsyncSession, None]:
    session_maker = cast(async_sessionmaker[AsyncSession], session_factory)
    async with session_maker() as session:
        yield session


@inject
async def get_context(
    context: Annotated[Context, Depends(Provide[Container.context])],
) -> Context:
    return context


@inject
async def get_weaviate_client(
    weaviate_client: Annotated[
        weaviate.WeaviateAsyncClient, Depends(Provide[Container.weaviate_client])
    ],
) -> weaviate.WeaviateAsyncClient:
    return weaviate_client
