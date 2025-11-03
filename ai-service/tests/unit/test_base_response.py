from app.api.schemas.base_response import AppResponse, FieldError, Meta, PaginationMeta
from app.api.schemas.errors import ErrorCode


def test_app_response_ok_minimal() -> None:
    payload = {"value": 1}

    response = AppResponse.ok(payload)

    assert response.success is True
    assert response.data == payload
    assert response.message is None
    assert response.meta is None
    assert response.trace_id is None


def test_app_response_ok_with_optional_fields() -> None:
    metadata = Meta(pagination=PaginationMeta(page=1, size=25, total=100))

    response = AppResponse.ok(
        {"value": 2},
        message="All good",
        meta=metadata,
        trace_id="abc123",
    )

    assert response.success is True
    assert response.data == {"value": 2}
    assert response.message == "All good"
    assert response.meta == metadata
    assert response.trace_id == "abc123"


def test_app_response_fail_minimal() -> None:
    response = AppResponse.fail(
        code=ErrorCode.INTERNAL_ERROR,
        message="Something went wrong",
    )

    assert response.success is False
    assert response.data is None
    assert response.error is not None
    assert response.error.code is ErrorCode.INTERNAL_ERROR
    assert response.error.message == "Something went wrong"
    assert response.error.errors == []
    assert response.trace_id is None


def test_app_response_fail_with_errors_and_trace_id() -> None:
    errors = [FieldError(field="email", reason="invalid format")]

    response = AppResponse.fail(
        code=ErrorCode.VALIDATION_ERROR,
        message="Invalid payload",
        detail={"field": "email"},
        errors=errors,
        trace_id="trace-123",
    )

    assert response.success is False
    assert response.data is None
    assert response.error is not None
    assert response.error.code is ErrorCode.VALIDATION_ERROR
    assert response.error.message == "Invalid payload"
    assert response.error.detail == {"field": "email"}
    assert response.error.errors == errors
    assert response.trace_id == "trace-123"
