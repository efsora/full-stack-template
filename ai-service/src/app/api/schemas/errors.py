from __future__ import annotations

from enum import Enum

__all__ = ["ErrorCode"]


class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    HTTP_ERROR = "HTTP_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    CONFLICT = "CONFLICT"
    WEAVIATE_ERROR = "WEAVIATE_ERROR"
