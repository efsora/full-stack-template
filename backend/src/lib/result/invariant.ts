/**
 * Invariant assertion utility for development-time checks
 *
 * This module provides runtime assertions that help catch programming errors early.
 * Invariants are enabled in development and disabled in production for performance.
 *
 * Use invariant() for "should never happen" scenarios that indicate bugs in the code,
 * NOT for expected runtime failures (use fail() for those).
 */

/**
 * Assert an invariant condition
 *
 * If the condition is false, throws an error with the provided message.
 * In production (NODE_ENV === 'production'), invariants are disabled for performance.
 *
 * Use this for:
 * - API contract violations (calling functions with invalid preconditions)
 * - Type system gaps (exhaustiveness checking in switch statements)
 * - Internal consistency checks ("this should never happen" scenarios)
 *
 * DO NOT use this for:
 * - Expected runtime failures (use fail() to return Failure instead)
 * - User input validation (use fail() with VALIDATION_ERROR)
 * - Business rule violations (use fail() with appropriate error code)
 *
 * @param condition - Condition that must be true
 * @param message - Error message if condition is false
 * @throws Error with "[Invariant Violation]" prefix if condition is false
 *
 * @example
 * ```typescript
 * // Type system exhaustiveness check
 * function handleResult(result: Result<string>): string {
 *   switch (result.status) {
 *     case "Success":
 *       return result.value;
 *     case "Failure":
 *       throw result.error;
 *     case "Command":
 *       invariant(false, "Unexpected Command in handleResult");
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // API misuse check
 * invariant(
 *   result.status !== "Command",
 *   "matchResponse() must be called after run()"
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Internal consistency check
 * const values = results.map((result) => {
 *   invariant(
 *     result.status === "Success",
 *     "Expected only Success results after filtering failures"
 *   );
 *   return result.value;
 * });
 * ```
 */
export function invariant(condition: boolean, message: string): asserts condition {
  // In production, skip invariant checks for performance
  if (process.env.NODE_ENV === "production") {
    return;
  }

  // In development, throw if condition is false
  if (!condition) {
    throw new Error(`[Invariant Violation] ${message}`);
  }
}
