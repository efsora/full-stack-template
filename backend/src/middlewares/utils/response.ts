/**
 * Response Utilities
 *
 * Provides backward-compatible utilities for middleware that need to send
 * error responses directly (auth, validation, etc.).
 *
 * For handlers, use the new AppResponse system:
 * @see #lib/types/response
 */

import { getTraceId } from "#infrastructure/logger/context";
import type { FailureResponse } from "#lib/types/response";

/**
 * Creates an error response in the new AppResponse format
 * Backward-compatible helper for middleware that send errors directly
 *
 * @param message - Error message
 * @param code - Error code
 * @param details - Optional error details
 * @returns FailureResponse matching the new format
 */
export function errorResponse(
  message: string,
  code: string,
  details?: unknown,
): FailureResponse {
  const error: FailureResponse["error"] = {
    code: code as never, // Type cast needed for backward compatibility
    message,
  };

  if (details !== undefined) {
    error.context = { details };
  }

  return {
    success: false,
    error,
    message,
    traceId: getTraceId() ?? "unknown",
    data: null,
    meta: null,
  };
}
