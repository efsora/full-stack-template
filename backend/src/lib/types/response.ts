/**
 * Universal API Response Type System
 *
 * This module defines the standard response format for all API endpoints.
 * Uses discriminated unions for type-safe success/failure handling.
 */

import { getTraceId as getTraceIdFromContext } from "#infrastructure/logger/context";
import type { AppError } from "#lib/result/types/errors";

/**
 * Pagination metadata for list responses
 */
export type PaginationMeta = {
  /** Current page number */
  page: number;
  /** Number of items per page */
  size: number;
  /** Total number of items */
  total: number;
};

/**
 * Cursor-based pagination metadata
 */
export type CursorMeta = {
  /** Cursor for next page */
  next_cursor?: string | null;
  /** Cursor for previous page */
  previous_cursor?: string | null;
};

/**
 * Metadata container for responses
 * Can include pagination or cursor-based pagination
 */
export type Meta = {
  /** Pagination metadata */
  pagination?: PaginationMeta | null;
  /** Cursor metadata */
  cursor?: CursorMeta | null;
};

/**
 * Success response with discriminated union
 * Used when operation succeeds
 */
export type SuccessResponse<T> = {
  /** Data payload */
  data: T;
  /** Error field (always null for success) */
  error?: null;
  /** Optional metadata */
  meta?: Meta | null;
  /** Optional message */
  message?: null;
  /** Always true for success */
  success: true;
  /** Trace ID for request correlation */
  traceId: string;
};

/**
 * Failure response with discriminated union
 * Used when operation fails
 */
export type FailureResponse = {
  /** Data field (always null for failure) */
  data?: null;
  /** Error details */
  error: AppError;
  /** Optional metadata */
  meta?: null;
  /** Error message */
  message: string;
  /** Always false for failure */
  success: false;
  /** Trace ID for request correlation */
  traceId: string;
};

/**
 * Universal API response type
 * Discriminated union of success and failure responses
 */
export type AppResponse<T> = FailureResponse | SuccessResponse<T>;

/**
 * Get trace ID from AsyncLocalStorage context
 * Falls back to 'unknown' if not available
 *
 * @returns Trace ID string or 'unknown'
 */
export function getTraceId(): string {
  return getTraceIdFromContext() ?? "unknown";
}

/**
 * Create a success response
 *
 * @param data - Response data payload
 * @param meta - Optional metadata (pagination, cursor)
 * @returns Typed success response
 *
 * @example
 * ```typescript
 * return createSuccessResponse({ id: 1, name: "John" });
 * ```
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: Meta,
): SuccessResponse<T> {
  return {
    data,
    error: null,
    message: null,
    meta: meta ?? null,
    success: true,
    traceId: getTraceId(),
  };
}

/**
 * Create a failure response
 *
 * @param error - AppError with error details
 * @returns Typed failure response
 *
 * @example
 * ```typescript
 * return createFailureResponse({
 *   code: "NOT_FOUND",
 *   message: "User not found",
 *   resourceType: "user",
 *   resourceId: 123
 * });
 * ```
 */
export function createFailureResponse(error: AppError): FailureResponse {
  return {
    data: null,
    error,
    message: error.message,
    meta: null,
    success: false,
    traceId: getTraceId(),
  };
}

/**
 * Create a paginated success response
 *
 * @param data - Response data payload (array)
 * @param pagination - Pagination metadata
 * @returns Typed success response with pagination
 *
 * @example
 * ```typescript
 * return createPaginatedSuccessResponse(
 *   users,
 *   { page: 1, size: 10, total: 100 }
 * );
 * ```
 */
export function createPaginatedSuccessResponse<T>(
  data: T,
  pagination: PaginationMeta,
): SuccessResponse<T> {
  return {
    data,
    error: null,
    message: null,
    meta: { cursor: null, pagination },
    success: true,
    traceId: getTraceId(),
  };
}
