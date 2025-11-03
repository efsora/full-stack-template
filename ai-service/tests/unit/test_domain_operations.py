from datetime import datetime
from typing import Any

import pytest

from app.core.context import Context
from app.domain import operations
from app.domain.models import User
from app.domain.primitives import EmailStr


class DummySession:
    def __init__(self) -> None:
        self.commits = 0

    async def commit(self) -> None:
        self.commits += 1

    async def close(self) -> None:
        pass


@pytest.mark.asyncio
async def test_create_user_operation_returns_domain_user(monkeypatch: pytest.MonkeyPatch) -> None:
    session = DummySession()
    ctx = Context(lambda: session)  # pyright: ignore[reportArgumentType]
    now = datetime.utcnow()

    class FakeEntity:
        id = 1
        name = "Alice"
        surname = "Smith"
        email = "alice.smith@example.com"
        created_at = now
        updated_at = now

    async def fake_create_user_in_db(
        ctx_arg: Context, user_name: str, user_surname: str, email: str
    ) -> Any:
        assert ctx_arg is ctx
        assert user_name == "Alice"
        assert user_surname == "Smith"
        assert email == "alice.smith@example.com"
        return FakeEntity()

    monkeypatch.setattr(operations, "create_user_in_db", fake_create_user_in_db)

    result = await operations.create_user_operation(ctx, "Alice", "Smith")

    assert session.commits == 0
    assert isinstance(result, User)
    assert result.user_name == "Alice"
    assert result.user_surname == "Smith"
    assert result.email == EmailStr("alice.smith@example.com")
    assert result.created_at == now
    assert result.updated_at == now
