import asyncio
from collections.abc import AsyncGenerator, Iterator
import os
from typing import Any, cast

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.api.dependencies import get_session
from app.core.settings import Settings, get_settings
from app.infrastructure.db.engine import create_engine
from app.infrastructure.db.schema import metadata
from app.infrastructure.db.utils import drop_schema, ensure_database_exists, ensure_schema_exists
from app.main import create_app
from app.services.weaviate_service import WeaviateService

# Set test environment
os.environ["ENV"] = "test"

# Always use test_schema for test isolation
TEST_SCHEMA = "test_schema"


@pytest.fixture(scope="session")
def event_loop() -> Iterator[asyncio.AbstractEventLoop]:
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def settings() -> Settings:
    return get_settings()


@pytest_asyncio.fixture(scope="session")
async def async_engine(settings: Settings) -> AsyncGenerator[AsyncEngine, None]:
    """
    Create async engine with test_schema.

    This fixture:
    1. Ensures the main database exists
    2. Creates test_schema
    3. Creates all tables in test_schema
    4. Sets up event listener to set search_path on each new connection
    5. Cleans up test_schema after tests
    """
    try:
        # Ensure database exists
        await ensure_database_exists(settings.DATABASE_URL)

        # Create test_schema
        await ensure_schema_exists(settings.DATABASE_URL, TEST_SCHEMA)

        # Create engine
        engine = create_engine(settings)

        # Set up event listener to set search_path on each new connection
        from sqlalchemy import event
        from sqlalchemy.pool import Pool

        @event.listens_for(Pool, "connect")
        def receive_connect(dbapi_conn, connection_record):  # type: ignore[no-untyped-def]
            """Set search_path on new connections."""
            try:
                dbapi_conn.execute(f"SET search_path TO {TEST_SCHEMA}")
            except Exception:
                # Ignore errors if search_path setting fails
                pass

        # Create all tables in test_schema
        async with engine.begin() as conn:
            await conn.execute(text(f"SET search_path TO {TEST_SCHEMA}"))
            await conn.run_sync(metadata.create_all)

        yield engine
    finally:
        # Cleanup: drop test_schema and all its contents
        await engine.dispose()
        try:
            await drop_schema(settings.DATABASE_URL, TEST_SCHEMA)
        except Exception:
            pass  # Ignore errors during cleanup


@pytest.fixture(scope="session")
def session_maker(async_engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """Create session maker that uses test_schema."""
    return async_sessionmaker(bind=async_engine, expire_on_commit=False)


@pytest_asyncio.fixture(autouse=True)
async def truncate_tables(async_engine: AsyncEngine) -> AsyncGenerator[None, None]:
    """
    Truncate test_schema.users before and after each test.

    This ensures test isolation - each test starts with clean data.
    """
    async with async_engine.begin() as conn:
        # Only truncate test_schema, never touch public schema
        await conn.execute(text("TRUNCATE TABLE test_schema.users RESTART IDENTITY CASCADE"))
    try:
        yield
    finally:
        async with async_engine.begin() as conn:
            await conn.execute(text("TRUNCATE TABLE test_schema.users RESTART IDENTITY CASCADE"))


@pytest_asyncio.fixture()
async def db_session(
    session_maker: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncSession, None]:
    async with session_maker() as session:
        yield session


@pytest.fixture()
def sample_user_payload() -> dict[str, str]:
    return {
        "user_name": "Alice",
        "user_surname": "Smith",
        "password": "hunter22",
    }


@pytest_asyncio.fixture()
async def app_with_overrides(
    session_maker: async_sessionmaker[AsyncSession],
    async_engine: AsyncEngine,
) -> AsyncGenerator[FastAPI, None]:
    app = create_app()

    # Override get_session to use test session_maker
    async def _session_override() -> AsyncGenerator[AsyncSession, None]:
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_session] = _session_override

    # Start the app lifespan
    lifespan = app.router.lifespan_context(app)
    await lifespan.__aenter__()

    try:
        # After lifespan starts, override the container engine and session_factory
        container = cast(Any, app.state).container
        container.engine.override(async_engine)
        container.session_factory.override(session_maker)
        yield app
    finally:
        await lifespan.__aexit__(None, None, None)
        app.dependency_overrides.clear()


class MockWeaviateService:
    """Mock Weaviate service for testing."""

    def __init__(self) -> None:
        self.storage: dict[str, list[dict[str, object]]] = {}
        self.uuid_counter = 0

    async def embed_text(self, text: str, collection: str) -> dict[str, object]:
        """Mock embed text."""
        if collection not in self.storage:
            self.storage[collection] = []

        self.uuid_counter += 1
        uuid = f"test-uuid-{self.uuid_counter}"

        self.storage[collection].append({"text": text, "uuid": uuid})

        return {
            "text": text,
            "collection": collection,
            "uuid": uuid,
        }

    async def search(self, query: str, collection: str, limit: int = 10) -> dict[str, object]:
        """Mock search."""
        if collection not in self.storage:
            return {
                "query": query,
                "collection": collection,
                "results": [],
                "count": 0,
            }

        # Simple BM25-like scoring (word frequency)
        query_words = set(query.lower().split())
        results = []

        for item in self.storage[collection]:
            text = str(item.get("text", "")).lower()
            text_words = set(text.split())
            score = len(query_words & text_words) / (len(query_words) + 1)

            if score > 0:
                results.append(
                    {
                        "uuid": item["uuid"],
                        "text": item["text"],
                        "distance": 1 - score,  # Invert for distance metric
                        "properties": {"text": item["text"]},
                    }
                )

        # Sort by distance (ascending)
        results.sort(key=lambda x: float(x["distance"]))  # type: ignore[arg-type]
        results = results[:limit]

        return {
            "query": query,
            "collection": collection,
            "results": results,
            "count": len(results),
        }


@pytest_asyncio.fixture()
async def mock_weaviate_service() -> MockWeaviateService:
    """Provide a mock Weaviate service."""
    return MockWeaviateService()


@pytest_asyncio.fixture()
async def client(
    app_with_overrides: FastAPI,
    mock_weaviate_service: MockWeaviateService,
) -> AsyncGenerator[AsyncClient, None]:
    # Override the weaviate service with mock
    def mock_get_weaviate_service() -> MockWeaviateService:
        return mock_weaviate_service

    app_with_overrides.dependency_overrides[WeaviateService] = mock_get_weaviate_service

    transport = ASGITransport(app=app_with_overrides)
    async with AsyncClient(transport=transport, base_url="http://testserver") as test_client:
        yield test_client
