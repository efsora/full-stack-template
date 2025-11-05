import json

import pytest
from starlette.requests import Request

from app.api.schemas.errors import ErrorCode
from app.core.exceptions import DomainValidationError
from app.main import app_exception_handler


async def _receive() -> dict[str, str]:
    return {"type": "http.request"}


def _make_request() -> Request:
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


def test_domain_validation_error_payload() -> None:
    exc = DomainValidationError(
        "Invalid email address",
        field="email",
        detail={"value": "invalid"},
    )

    assert exc.code is ErrorCode.VALIDATION_ERROR
    assert exc.status_code == 422
    assert exc.errors == [("email", "Invalid email address")]
    assert exc.detail == {"value": "invalid"}


@pytest.mark.asyncio
async def test_app_exception_handler_formats_response() -> None:
    request = _make_request()
    request.state.trace_id = "trace-123"

    exc = DomainValidationError(
        "Invalid email address",
        field="email",
        detail={"value": "invalid"},
    )

    response = await app_exception_handler(request, exc)

    assert response.status_code == 422
    body = response.body if isinstance(response.body, bytes) else bytes(response.body)
    payload = json.loads(body.decode())
    assert payload["success"] is False
    assert payload["error"]["code"] == ErrorCode.VALIDATION_ERROR.value
    assert payload["error"]["errors"] == [{"field": "email", "reason": "Invalid email address"}]
    assert payload["trace_id"] == "trace-123"
