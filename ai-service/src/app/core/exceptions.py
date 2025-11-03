from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from fastapi import status

from app.api.schemas.errors import ErrorCode

FieldErrorPayload = tuple[str | None, str]


class AppException(Exception):
    """Base exception for application errors that map to API responses."""

    def __init__(
        self,
        *,
        code: ErrorCode,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        detail: str | dict[str, Any] | list[Any] | None = None,
        errors: Iterable[FieldErrorPayload] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.detail = detail
        self.errors = list(errors or [])


class DomainValidationError(AppException):
    """Value object/domain validation failure."""

    def __init__(
        self,
        message: str,
        *,
        field: str | None = None,
        detail: str | dict[str, Any] | list[Any] | None = None,
    ) -> None:
        errors: list[FieldErrorPayload] = []
        if field is not None:
            errors.append((field, message))
        super().__init__(
            code=ErrorCode.VALIDATION_ERROR,
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=detail,
            errors=errors,
        )


__all__ = [
    "AppException",
    "DomainValidationError",
]
