from datetime import datetime
from typing import Any
from unittest.mock import Mock

import pytest
from starlette.requests import Request

from app.api.schemas.request import CreateUserRequest
from app.api.v1 import routes, user_routes
from app.core.context import Context
from app.domain.models import User
from app.domain.primitives import EmailStr


async def _receive() -> dict[str, Any]:
    return {"type": "http.request"}


def build_request() -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [],
        "query_string": b"",
        "client": ("testclient", 1234),
        "server": ("testserver", 80),
    }
    return Request(scope, _receive)


@pytest.mark.asyncio
async def test_hello_returns_trace_id() -> None:
    request = build_request()
    request.state.trace_id = "trace-123"

    # Create mock context with logger
    mock_ctx = Mock(spec=Context)
    mock_ctx.logger = Mock()

    response = await routes.hello(request, mock_ctx)

    assert response.success is True
    assert response.data == routes.HelloResponse(message="Hello, World!")
    assert response.trace_id == "trace-123"


@pytest.mark.asyncio
async def test_create_user_route_builds_response() -> None:
    payload = CreateUserRequest(user_name="Alice", user_surname="Smith", password="password")
    request = build_request()
    request.state.trace_id = "trace-xyz"

    dummy_user = User(
        id=1,
        user_name=payload.user_name,
        user_surname=payload.user_surname,
        email=EmailStr("alice.smith@example.com"),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    # Create mock context with logger
    mock_ctx = Mock(spec=Context)
    mock_ctx.logger = Mock()

    class DummyUserService:
        @property
        def ctx(self) -> Context:
            return mock_ctx  # type: ignore

        async def create_user(self, user_name: str, user_surname: str) -> User:
            assert user_name == payload.user_name
            assert user_surname == payload.user_surname
            return dummy_user

    response = await user_routes.create_user(
        request, payload, DummyUserService()  # type: ignore[arg-type]
    )

    assert response.success is True
    assert response.message == "User created"
    assert response.trace_id == "trace-xyz"
    assert response.data is not None
    assert response.data.user_name == payload.user_name
    assert response.data.user_surname == payload.user_surname
    assert response.data.email == "alice.smith@example.com"
