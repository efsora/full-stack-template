from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from typing import Any, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession
import structlog

SessionFactory = Callable[[], AsyncSession]
T = TypeVar("T")


class Context:
    """Request-scoped access point for infrastructure dependencies."""

    def __init__(self, session_factory: SessionFactory) -> None:
        self._session_factory = session_factory
        self._session_stack: list[AsyncSession] = []
        self._logger = structlog.get_logger()

    @property
    def session_factory(self) -> SessionFactory:
        return self._session_factory

    @property
    def logger(self) -> structlog.BoundLogger:
        """Get logger instance from context."""
        return self._logger

    @property
    def db_session(self) -> AsyncSession:
        if not self._session_stack:
            raise RuntimeError("No active database session. Call Context.unit_of_work().")
        return self._session_stack[-1]

    def unit_of_work(self) -> UnitOfWork:
        return UnitOfWork(self, self._session_factory)

    async def autocommit(
        self,
        fn: Callable[..., Awaitable[T]],
        *args: Any,
        **kwargs: Any,
    ) -> T:
        async with self.autocommit_scope():
            return await fn(self, *args, **kwargs)

    @asynccontextmanager
    async def autocommit_scope(self) -> AsyncIterator[AsyncSession]:
        async with self.session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        session = self._session_factory()
        self._session_stack.append(session)
        try:
            yield session
        finally:
            self._session_stack.pop()
            await session.close()


class UnitOfWork:
    """Context manager that coordinates a single transaction."""

    def __init__(self, context: Context, session_factory: SessionFactory) -> None:
        self._context = context
        self._session_factory = session_factory
        self._session: AsyncSession | None = None

    async def __aenter__(self) -> AsyncSession:
        session = self._session_factory()
        self._context._session_stack.append(session)
        self._session = session
        return session

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: object,
    ) -> None:
        if self._session is None:
            return
        try:
            if exc is None:
                await self._session.commit()
            else:
                await self._session.rollback()
        finally:
            await self._session.close()
            if self._context._session_stack and self._context._session_stack[-1] is self._session:
                self._context._session_stack.pop()
            else:
                try:
                    self._context._session_stack.remove(self._session)
                except ValueError:
                    pass
            self._session = None

    @property
    def session(self) -> AsyncSession | None:
        return self._session
