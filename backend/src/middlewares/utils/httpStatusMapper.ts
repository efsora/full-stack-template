import type { AppError } from "#lib/result/types/errors";

/**
 * Get HTTP status code for successful responses based on request method
 *
 * HTTP semantics:
 * - POST → 201 Created: Resource was created
 * - All others → 200 OK: Request succeeded
 *
 * @param method - HTTP request method (GET, POST, PUT, DELETE, PATCH, etc.)
 * @returns HTTP status code for success response
 *
 * @example
 * ```ts
 * const statusCode = getSuccessStatusCode("POST"); // 201
 * const statusCode = getSuccessStatusCode("GET");  // 200
 * const statusCode = getSuccessStatusCode("PUT");  // 200
 * ```
 */
export function getSuccessStatusCode(method: string): number {
  return method === "POST" ? 201 : 200;
}

/**
 * Map error codes to HTTP status codes
 *
 * This is an infrastructure concern (HTTP status codes), not business logic.
 * The mapping defines how business-layer error codes translate to HTTP semantics.
 *
 * Pattern Matching Rules:
 * - *_NOT_FOUND → 404 Not Found: Resource doesn't exist
 * - *_FORBIDDEN → 403 Forbidden: User authenticated but lacks permission
 * - *_INVALID_* → 400 Bad Request: Invalid input from client
 * - *_ALREADY_EXISTS → 409 Conflict: Resource already exists
 * - UNAUTHORIZED → 401 Unauthorized: User not authenticated
 * - INTERNAL_ERROR → 500 Internal Server Error: Unexpected server error
 * - COMMAND_EXECUTION_ERROR → 500 Internal Server Error: Effect execution failure
 * - Default → 500 Internal Server Error: Unknown error
 *
 * @param error - AppError with error code
 * @returns HTTP status code corresponding to the error code
 *
 * @example
 * ```ts
 * const error: AppError = { code: "USER_NOT_FOUND", message: "User not found" };
 * const statusCode = mapErrorCodeToStatus(error); // 404
 *
 * const error2: AppError = { code: "USER_INVALID_EMAIL", message: "Invalid email" };
 * const statusCode2 = mapErrorCodeToStatus(error2); // 400
 * ```
 */
export function mapErrorCodeToStatus(error: AppError): number {
  const code = error.code;

  // Generic error codes (explicit mapping)
  if (code === "UNAUTHORIZED") return 401;
  if (code === "INTERNAL_ERROR") return 500;
  if (code === "COMMAND_EXECUTION_ERROR") return 500;

  // Domain-specific error codes (pattern matching)
  if (code.endsWith("_NOT_FOUND")) return 404;
  if (code.endsWith("_FORBIDDEN")) return 403;
  if (code.includes("_INVALID_")) return 400;
  if (code.endsWith("_ALREADY_EXISTS")) return 409;

  // Default fallback for unknown error codes
  return 500;
}
