/**
 * Error Type System for Effect-based Error Handling
 *
 * This module defines the complete type system for typed errors in the Effect system.
 * All errors extend ErrorBase and use generic error codes with contextual information.
 *
 * Design Principles:
 * - Generic error codes (NOT_FOUND, FORBIDDEN, etc.) instead of domain-specific codes
 * - Rich metadata for observability (userId, resourceId, timestamp, context)
 * - Compile-time type safety for all error fields
 * - Domain-specific error types unified in AppError union
 */

/**
 * Global application error union.
 * Combines all domain-specific errors into a single union type.
 * This type is used throughout the Effect system for type-safe error handling.
 *
 * Domain errors are imported from their respective modules:
 * - UserError: User authentication, registration, profile errors
 * - PostError: Post CRUD operation errors
 * - CommentError: Comment CRUD operation errors
 * - AuthError: Authentication and authorization errors
 *
 * Base error types (for cases not covered by domains):
 * - CommandExecutionError: Effect execution failures
 * - InternalError: Unexpected server errors
 */
export type AppError =
  | CommandExecutionError
  | ConflictError
  | ForbiddenError
  | InternalError
  | NotFoundError
  | UnauthorizedError
  | ValidationError;

/**
 * Command execution error - effect execution failure.
 * Used when a CommandEffect throws an exception during execution.
 *
 * @property code - Always "COMMAND_EXECUTION_ERROR"
 *
 * @example
 * ```typescript
 * {
 *   code: "COMMAND_EXECUTION_ERROR",
 *   message: "Database query failed",
 *   timestamp: "2025-10-19T10:30:00.000Z",
 *   context: { operation: "findUserById", error: "Connection timeout" }
 * }
 * ```
 */
export type CommandExecutionError = ErrorBase & {
  code: "COMMAND_EXECUTION_ERROR";
};

/**
 * Conflict error - resource conflict occurred.
 * Used when attempting to create a resource that already exists.
 *
 * @property code - Always "CONFLICT"
 * @property conflictType - Type of conflict that occurred
 *
 * @example
 * ```typescript
 * {
 *   code: "CONFLICT",
 *   message: "Email already in use",
 *   conflictType: "email",
 *   email: "user@example.com",
 *   timestamp: "2025-10-19T10:30:00.000Z"
 * }
 * ```
 */
export type ConflictError = ErrorBase & {
  code: "CONFLICT";
  conflictType: ConflictType;
  email?: string; // For email conflicts
};

/**
 * Conflict types for CONFLICT errors.
 * Represents what kind of conflict occurred.
 */
export type ConflictType = "email"; // Extensible for future conflicts like username, slug, etc.

/**
 * Base error structure containing common metadata fields.
 * All domain-specific errors extend this base.
 *
 * @property message - Human-readable error message
 * @property timestamp - ISO 8601 timestamp when error occurred (manually provided)
 * @property userId - Optional ID of user who triggered the error
 * @property resourceId - Optional ID of related resource (may duplicate specific error field)
 * @property context - Optional free-form request metadata (ip, userAgent, requestId, etc.)
 */
export interface ErrorBase {
  context?: Record<string, unknown>;
  message: string;
  resourceId?: number;
  timestamp?: string;
  userId?: number;
}

/**
 * Generic error codes used across all domains.
 * These are HTTP-agnostic and represent business-level error categories.
 */
export type ErrorCode =
  | "COMMAND_EXECUTION_ERROR" // Effect execution failure
  | "CONFLICT" // Resource conflict (e.g., email already taken)
  | "FORBIDDEN" // User authenticated but lacks permission
  | "INTERNAL_ERROR" // Unexpected server error
  | "NOT_FOUND" // Resource doesn't exist
  | "UNAUTHORIZED" // User not authenticated
  | "VALIDATION_ERROR"; // Invalid input from client

/**
 * Forbidden error - user lacks permission for the action.
 * Used when user is authenticated but doesn't have access rights.
 *
 * @property code - Always "FORBIDDEN"
 * @property resourceType - Type of resource access was denied to
 * @property resourceId - ID of the resource access was denied to
 *
 * @example
 * ```typescript
 * {
 *   code: "FORBIDDEN",
 *   message: "You can only modify your own posts",
 *   resourceType: "post",
 *   resourceId: 123,
 *   userId: 456,
 *   timestamp: "2025-10-19T10:30:00.000Z"
 * }
 * ```
 */
export type ForbiddenError = ErrorBase & {
  code: "FORBIDDEN";
  resourceId: number;
  resourceType: ResourceType;
};

/**
 * Internal error - unexpected server error.
 * Used for unhandled exceptions and unexpected error conditions.
 *
 * @property code - Always "INTERNAL_ERROR"
 *
 * @example
 * ```typescript
 * {
 *   code: "INTERNAL_ERROR",
 *   message: "Database connection failed",
 *   timestamp: "2025-10-19T10:30:00.000Z"
 * }
 * ```
 */
export type InternalError = ErrorBase & {
  code: "INTERNAL_ERROR";
};

/**
 * Not found error - requested resource doesn't exist.
 * Used when a database query returns no results.
 *
 * @property code - Always "NOT_FOUND"
 * @property resourceType - Type of resource that wasn't found
 * @property resourceId - ID of the resource that wasn't found
 *
 * @example
 * ```typescript
 * {
 *   code: "NOT_FOUND",
 *   message: "Post not found",
 *   resourceType: "post",
 *   resourceId: 123,
 *   timestamp: "2025-10-19T10:30:00.000Z"
 * }
 * ```
 */
export type NotFoundError = ErrorBase & {
  code: "NOT_FOUND";
  resourceId: number;
  resourceType: ResourceType;
};

/**
 * Resource types for NOT_FOUND and FORBIDDEN errors.
 * Represents the domain entity that was not found or access was forbidden to.
 */
export type ResourceType = "auth" | "comment" | "post" | "user";

/**
 * Unauthorized error - user not authenticated.
 * Used when authentication is required but not provided or invalid.
 *
 * @property code - Always "UNAUTHORIZED"
 *
 * @example
 * ```typescript
 * {
 *   code: "UNAUTHORIZED",
 *   message: "Invalid email or password",
 *   timestamp: "2025-10-19T10:30:00.000Z"
 * }
 * ```
 */
export type UnauthorizedError = ErrorBase & {
  code: "UNAUTHORIZED";
};

/**
 * Validation error - invalid input from client.
 * Used when user input fails validation rules.
 *
 * @property code - Always "VALIDATION_ERROR"
 * @property field - The field that failed validation
 *
 * @example
 * ```typescript
 * {
 *   code: "VALIDATION_ERROR",
 *   message: "Invalid email format",
 *   field: "email",
 *   timestamp: "2025-10-19T10:30:00.000Z"
 * }
 * ```
 */
export type ValidationError = ErrorBase & {
  code: "VALIDATION_ERROR";
  field: string;
};

/**
 * Type guard to check if an error is a command execution error.
 */
export function isCommandExecutionError(error: AppError): error is CommandExecutionError {
  return error.code === "COMMAND_EXECUTION_ERROR";
}

/**
 * Type guard to check if an error is a conflict error.
 */
export function isConflictError(error: AppError): error is ConflictError {
  return error.code === "CONFLICT";
}

/**
 * Type guard to check if an error is a forbidden error.
 */
export function isForbiddenError(error: AppError): error is ForbiddenError {
  return error.code === "FORBIDDEN";
}

/**
 * Type guard to check if an error is an internal error.
 */
export function isInternalError(error: AppError): error is InternalError {
  return error.code === "INTERNAL_ERROR";
}

/**
 * Type guard to check if an error is a not found error.
 */
export function isNotFoundError(error: AppError): error is NotFoundError {
  return error.code === "NOT_FOUND";
}

/**
 * Type guard to check if an error is an unauthorized error.
 */
export function isUnauthorizedError(error: AppError): error is UnauthorizedError {
  return error.code === "UNAUTHORIZED";
}

/**
 * Type guard to check if an error is a validation error.
 */
export function isValidationError(error: AppError): error is ValidationError {
  return error.code === "VALIDATION_ERROR";
}