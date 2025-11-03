from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

from app.api.schemas.errors import ErrorCode

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    size: int
    total: int


class CursorMeta(BaseModel):
    next_cursor: str | None = None
    previous_cursor: str | None = None


class Meta(BaseModel):
    pagination: PaginationMeta | None = None
    cursor: CursorMeta | None = None


class FieldError(BaseModel):
    field: str | None = None
    reason: str


class ErrorInfo(BaseModel):
    code: ErrorCode
    message: str
    detail: str | dict[str, Any] | list[Any] | None = None
    errors: list[FieldError] = Field(default_factory=list)


class AppResponse(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    message: str | None = None
    meta: Meta | None = None
    error: ErrorInfo | None = None
    trace_id: str | None = None

    @classmethod
    def ok(
        cls,
        data: T,
        *,
        message: str | None = None,
        meta: Meta | None = None,
        trace_id: str | None = None,
    ) -> AppResponse[T]:
        payload: dict[str, Any] = {
            "success": True,
            "data": data,
        }
        if message is not None:
            payload["message"] = message
        if meta is not None:
            payload["meta"] = meta
        if trace_id is not None:
            payload["trace_id"] = trace_id
        return cls(**payload)

    @classmethod
    def fail(
        cls,
        *,
        code: ErrorCode,
        message: str,
        detail: str | dict[str, Any] | list[Any] | None = None,
        errors: list[FieldError] | None = None,
        trace_id: str | None = None,
    ) -> AppResponse[Any]:
        error = ErrorInfo(
            code=code,
            message=message,
            detail=detail,
            errors=errors or [],
        )
        payload: dict[str, Any] = {
            "success": False,
            "error": error,
        }
        if trace_id is not None:
            payload["trace_id"] = trace_id
        return cls(**payload)


__all__ = [
    "PaginationMeta",
    "CursorMeta",
    "Meta",
    "FieldError",
    "ErrorInfo",
    "AppResponse",
]
