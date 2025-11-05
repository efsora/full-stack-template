from datetime import datetime

import pytest

from app.core.context import Context
from app.domain.models import User
from app.domain.primitives import EmailStr
from app.services.user_service import UserService


@pytest.mark.asyncio
async def test_create_user_commits_session(monkeypatch: pytest.MonkeyPatch) -> None:
    ctx = Context(lambda: None)  # type: ignore[arg-type, return-value]

    expected_user = User(
        id=1,
        user_name="Alice",
        user_surname="Smith",
        email=EmailStr("alice.smith@example.com"),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    async def fake_create_user_operation(ctx_arg: Context, name: str, surname: str) -> User:
        assert ctx_arg is ctx
        assert name == "Alice"
        assert surname == "Smith"
        return expected_user

    monkeypatch.setattr(
        "app.services.user_service.create_user_operation",
        fake_create_user_operation,
    )

    service = UserService(ctx)

    result = await service.create_user("Alice", "Smith")

    assert result is expected_user


@pytest.mark.asyncio
async def test_create_user_rolls_back_on_error(monkeypatch: pytest.MonkeyPatch) -> None:
    ctx = Context(lambda: None)  # type: ignore[arg-type, return-value]

    async def fake_create_user_operation(ctx_arg: Context, name: str, surname: str) -> User:
        assert ctx_arg is ctx
        raise RuntimeError("boom")

    monkeypatch.setattr(
        "app.services.user_service.create_user_operation",
        fake_create_user_operation,
    )

    service = UserService(ctx)

    with pytest.raises(RuntimeError, match="boom"):
        await service.create_user("Alice", "Smith")
