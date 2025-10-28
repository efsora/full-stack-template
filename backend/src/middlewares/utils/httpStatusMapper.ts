import type { AppError, ErrorCode } from "#shared/effect/types/errors";

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
 * Error Code Mappings:
 * - VALIDATION_ERROR → 400 Bad Request: Invalid input from client
 * - UNAUTHORIZED → 401 Unauthorized: User not authenticated
 * - FORBIDDEN → 403 Forbidden: User authenticated but lacks permission
 * - NOT_FOUND → 404 Not Found: Resource doesn't exist
 * - CONFLICT → 409 Conflict: Resource conflict (e.g., email already taken)
 * - INTERNAL_ERROR → 500 Internal Server Error: Unexpected server error
 * - COMMAND_EXECUTION_ERROR → 500 Internal Server Error: Effect execution failure
 *
 * @param error - AppError with error code
 * @returns HTTP status code corresponding to the error code
 *
 * @example
 * ```ts
 * const error: AppError = { code: "NOT_FOUND", message: "User not found" };
 * const statusCode = mapErrorCodeToStatus(error); // 404
 * ```
 */
export function mapErrorCodeToStatus(error: AppError): number {
  const errorCodeMap: Record<ErrorCode, number> = {
    COMMAND_EXECUTION_ERROR: 500,
    CONFLICT: 409,
    FORBIDDEN: 403,
    INTERNAL_ERROR: 500,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    VALIDATION_ERROR: 400,
  };

  return errorCodeMap[error.code];
}