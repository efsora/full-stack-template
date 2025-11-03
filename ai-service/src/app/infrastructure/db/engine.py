from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.settings import Settings


def create_engine(settings: Settings, schema: str | None = None) -> AsyncEngine:
    """Create async engine with optional schema configuration.

    Note: The schema parameter is currently unused but kept for API compatibility.
    The search_path is set at the session level in conftest.py to ensure proper
    isolation of test schemas.
    """
    return create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )
