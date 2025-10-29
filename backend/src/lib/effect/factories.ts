/**
 * Effect Factory Functions
 *
 * Pure functions for creating Effect values.
 * These factories construct Success, Failure, and CommandEffect types.
 */

import type { CommandEffect, Effect, EffectMetadata, Failure, Success } from "#lib/effect/types";
import type { AppError } from "#lib/effect/types/errors";

import {
  extractCallerInfo,
  extractDomainFromFilePath,
  extractFilenameStem,
  inferActionFromFunctionName,
} from "#lib/effect/metadata";

/**
 * Creates a CommandEffect - a deferred side-effectful computation.
 *
 * Supports two modes:
 * 1. **Auto Mode** (metadata omitted): Automatically generates metadata from stack trace
 * 2. **Manual Mode** (metadata provided): Uses explicit metadata
 *
 * Auto mode uses stacktrace-js to extract:
 * - operation: Function name or filename stem
 * - domain: Extracted from file path (src/core/{domain})
 * - action: Inferred from function name prefix (find → "read", create → "create", etc.)
 *
 * @param command - Async operation to perform
 * @param continuation - Function to convert command result to next Effect
 * @param metadata - Optional metadata for observability (auto-generated if omitted)
 * @returns A CommandEffect that will be executed by runEffect()
 *
 * @example
 * ```ts
 * // Auto mode - metadata auto-generated from stack trace
 * export function findUserById(userId: number): Effect<User> {
 *   return commandEffect(
 *     async () => db.select().from(users).where(eq(users.id, userId)),
 *     (result) => result ? success(result) : failure("Not found", "NOT_FOUND")
 *     // Metadata omitted → auto-generates: { operation: "findUserById", tags: { domain: "users", action: "read" } }
 *   );
 * }
 *
 * // Manual mode - explicit metadata
 * export function customOperation(): Effect<Data> {
 *   return commandEffect(
 *     async () => { ... },
 *     (result) => success(result),
 *     { operation: "customName", tags: { domain: "custom", action: "special" } }
 *   );
 * }
 * ```
 */
export function commandEffect<TCommand, TResult>(
  command: () => Promise<TCommand>,
  continuation: (result: TCommand) => Effect<TResult>,
  metadata?: EffectMetadata,
): CommandEffect<TResult>;

export function commandEffect(
  command: () => Promise<unknown>,
  continuation: (result: unknown) => Effect<unknown>,
  metadata?: EffectMetadata,
): CommandEffect {
  // If metadata explicitly provided, use it directly (manual mode)
  if (metadata) {
    return {
      command,
      continuation,
      metadata,
      status: "CommandEffect",
    };
  }

  // Auto mode: generate metadata from stack trace using stacktrace-js
  const { filePath, functionName } = extractCallerInfo();

  // Determine operation name: function name or filename stem or "unknown"
  let operation: string;
  if (functionName) {
    operation = functionName;
  } else if (filePath) {
    operation = extractFilenameStem(filePath);
  } else {
    operation = "unknown";
  }

  // Extract domain from file path
  const domain = filePath ? extractDomainFromFilePath(filePath) : "unknown";

  // Infer action from operation name
  const action = inferActionFromFunctionName(operation);

  // Build auto-generated metadata
  const autoMetadata: EffectMetadata = {
    operation,
    tags: {
      action,
      domain,
    },
  };

  return {
    command,
    continuation,
    metadata: autoMetadata,
    status: "CommandEffect",
  };
}

/**
 * Creates a failed Effect with typed error information.
 *
 * This function accepts an AppError object containing all required error fields.
 * TypeScript enforces that all required fields for the specific error type are provided.
 *
 * @param error - Typed error object (AppError) with all required fields
 * @returns A Failure effect containing the typed error
 *
 * @example
 * ```ts
 * // Validation error (timestamp auto-generated)
 * const validationError = failure({
 *   code: "VALIDATION_ERROR",
 *   message: "Invalid email format",
 *   field: "email"
 * });
 *
 * // Not found error (timestamp auto-generated)
 * const notFoundError = failure({
 *   code: "NOT_FOUND",
 *   message: "Post not found",
 *   resourceType: "post",
 *   resourceId: 123,
 *   userId: 456
 * });
 *
 * // Conflict error (timestamp auto-generated)
 * const conflictError = failure({
 *   code: "CONFLICT",
 *   message: "Email already in use",
 *   conflictType: "email",
 *   email: "user@example.com"
 * });
 * ```
 */
export function failure(error: AppError): Failure {
  // Auto-generate timestamp if not provided
  const errorWithTimestamp: AppError = {
    ...error,
    timestamp: error.timestamp ?? new Date().toISOString(),
  };

  return {
    error: errorWithTimestamp,
    status: "Failure",
  };
}
/**
 * Creates a successful Effect with a value.
 *
 * @param value - The success value
 * @returns A Success effect containing the value
 *
 * @example
 * ```ts
 * const result = success({ id: 1, name: "John" });
 * // => { status: "Success", value: { id: 1, name: "John" } }
 * ```
 */
export function success<T>(value: T): Success<T> {
  return {
    status: "Success",
    value,
  };
}