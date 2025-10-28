import type { Effect } from "#shared/effect/index";
import type { AppError } from "#shared/effect/types/errors";

/**
 * Type guard to check if an error is an AppError
 * AppError objects have a code property with one of the known error codes
 * and a message property with a string description.
 *
 * This is used by the effectHandler middleware to distinguish AppError instances
 * (thrown by match() style handlers) from other error types.
 *
 * @param error - Error to check
 * @returns True if error is an AppError
 *
 * @example
 * ```ts
 * try {
 *   // Some operation
 * } catch (error) {
 *   if (isAppError(error)) {
 *     // Handle as AppError with code and message
 *   }
 * }
 * ```
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    typeof (error as AppError).code === "string" &&
    typeof (error as AppError).message === "string"
  );
}

/**
 * Type guard to check if a value is an Effect object
 * Effects have a status property that is one of: "Success", "Failure", or "CommandEffect"
 *
 * This is used by the effectHandler middleware to distinguish Effect objects
 * from raw data returned by handlers using the match() or matchResponse() combinators.
 *
 * @param value - Value to check
 * @returns True if value is an Effect
 *
 * @example
 * ```ts
 * const result = await runEffect(someEffect);
 * if (isEffect(result)) {
 *   // Handle Success/Failure cases
 * }
 * ```
 */
export function isEffect(value: unknown): value is Effect<unknown> {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    "status" in value &&
    (value.status === "Success" || value.status === "Failure" || value.status === "CommandEffect")
  );
}