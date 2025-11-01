import { AppError } from "./types/errors";

/**
 * Represents a side-effectful computation that produces a value of type T.
 * Uses `unknown` for internal type safety while preserving type inference at call sites.
 *
 * A Command defers execution until interpreted by run().
 * It consists of:
 * - command: The async operation to perform
 * - cont: How to process the command's result into the next Result
 * - metadata: Optional observability information (operation name, tags)
 */
export type Command<T = unknown> = {
  command: () => Promise<unknown>;
  continuation: (result: unknown) => Result<T>;
  metadata?: ResultMetadata;
  status: "Command";
}

/**
 * A computation that may succeed with a value, fail with an error, or require side effects.
 *
 * Result<T> is the core type of the result system. It represents:
 * - Success<T>: A pure value of type T
 * - Failure: An error with typed error information (AppError)
 * - Command<T>: A deferred computation that will eventually produce T
 */
export type Result<T> = Command<T> | Failure | Success<T>;

/**
 * Metadata for observability (logging, tracing, metrics).
 *
 * Attached to Command for instrumentation purposes.
 * Can be provided manually or auto-generated from stack traces.
 */
export type ResultMetadata = {
  operation: string; // e.g., "findUserByEmail", "savePost"
  tags?: Record<string, string>; // e.g., { domain: "users", action: "create" }
}

/**
 * Represents a failed computation with typed error information.
 *
 * The error field contains a fully-typed AppError object with:
 * - code: Error code for categorization (maps to HTTP status in middleware)
 * - message: Human-readable error message
 * - Additional type-specific fields (e.g., resourceId, field, etc.)
 * - Metadata: userId, resourceId, timestamp, context
 *
 * @example
 * ```typescript
 * {
 *   status: "Failure",
 *   error: {
 *     code: "NOT_FOUND",
 *     message: "Post not found",
 *     resourceType: "post",
 *     resourceId: 123,
 *     timestamp: "2025-10-19T10:30:00.000Z"
 *   }
 * }
 * ```
 */
export type Failure = {
  error: AppError;
  status: "Failure";
}

/**
 * Represents a successful computation with a value of type T.
 *
 * This is a pure value - it has already been computed and contains no side effects.
 */
export type Success<T> = {
  status: "Success";
  value: T;
}
