/**
 * Effect Interpreter
 *
 * Executes Effect values, running CommandEffects and returning Success/Failure results.
 * This is the bridge between the functional core (Effect descriptions) and the imperative shell.
 *
 * The interpreter:
 * - Uses tail-call style recursion to avoid stack overflow
 * - Automatically instruments effects with logging, metrics, and tracing
 * - Converts exceptions to Failure effects
 * - Preserves type safety throughout execution
 *
 * Architecture:
 * - Public API: `runEffect()` - Main entry point for executing effects
 * - Private helpers: Modular functions for instrumentation and error handling
 */

import type { Span } from "@opentelemetry/api";

import {
  type InstrumentationContext,
  loadInstrumentationContext,
  logError,
  logStart,
  logSuccess,
  withSpanContext,
} from "#lib/effect/instrumentation";

import type { CommandEffect, Effect, Failure } from "./types";

import { failure } from "#lib/effect/factories";

/**
 * Internal context for command execution tracking
 */
interface ExecutionContext {
  ctx: InstrumentationContext;
  duration: number;
  operation: string;
  span: null | Span;
  startTime: number;
  tags: Record<string, string>;
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Recursive effect interpreter using tail-call style recursion.
 * Executes CommandEffects and returns final Success or Failure values.
 * Automatically instruments effects with logging, metrics, and tracing for observability.
 *
 * @param effect - Effect to execute
 * @returns Promise resolving to Success or Failure
 *
 * @example
 * ```ts
 * // In functional core (pure)
 * export function findUser(id: number): Effect<User> {
 *   return commandEffect(
 *     async () => db.select().from(users).where(eq(users.id, id)),
 *     (result) => result ? success(result) : failure({
 *       code: "NOT_FOUND",
 *       message: "User not found",
 *       resourceType: "user",
 *       resourceId: id
 *     })
 *   );
 * }
 *
 * // In imperative shell (impure - route handler)
 * const result = await runEffect(findUser(123));
 * if (result.status === "Success") {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function runEffect<T>(effect: Effect<T>): Promise<Effect<T>> {
  // Pattern match on effect type
  switch (effect.status) {
    case "CommandEffect":
      // Execute CommandEffect with full instrumentation
      return executeCommandEffect(effect);

    case "Failure":
    case "Success":
      // Base case: pure value (Success or Failure), return as-is
      return effect;
  }
}

/**
 * Calculates execution duration and updates context
 *
 * @param execCtx - Execution context to update
 * @returns Updated execution context with duration
 */
function calculateDuration(execCtx: ExecutionContext): ExecutionContext {
  return {
    ...execCtx,
    duration: Date.now() - execCtx.startTime,
  };
}

/**
 * Executes a CommandEffect's command and handles the result
 *
 * @param effect - CommandEffect to execute
 * @param execCtx - Execution context
 * @returns Promise resolving to final Effect result
 */
async function executeCommandAndContinue<T>(
  effect: CommandEffect<T>,
  execCtx: ExecutionContext,
): Promise<Effect<T>> {
  // Execute the command (e.g., database query, API call)
  const commandResult: unknown = await effect.command();

  // Apply continuation to transform command result into next Effect
  const nextEffect = effect.continuation(commandResult);

  // Recursively execute the next effect (tail-call style)
  const finalEffect = await runEffect(nextEffect);

  // Update duration after full execution
  const updatedExecCtx = calculateDuration(execCtx);

  // Log and record metrics based on final result
  processEffectResult(updatedExecCtx, finalEffect);

  return finalEffect;
}

/**
 * Executes a CommandEffect with full instrumentation and span context propagation.
 * Wraps the entire execution (command + continuation + recursive runEffect) in the span's
 * active context, ensuring all child operations inherit this span as their parent.
 *
 * @param effect - CommandEffect to execute
 * @returns Promise resolving to final Effect result
 */
async function executeCommandEffect<T>(effect: CommandEffect<T>): Promise<Effect<T>> {
  // Initialize instrumentation context (creates span)
  const execCtx = await initializeExecutionContext(effect);

  // Wrap entire execution in span context for propagation
  // All async work (command execution, continuation, recursive runEffect) runs with active span context
  return withSpanContext(execCtx.span, async () => {
    try {
      // Execute command and process result
      // All nested effects will inherit this span as parent
      return await executeCommandAndContinue(effect, execCtx);
    } catch (error) {
      // Convert exceptions to Failure effects
      return handleCommandException(error, execCtx);
    }
  });
}

/**
 * Extracts metadata (operation name and tags) from CommandEffect
 *
 * @param effect - CommandEffect to extract metadata from
 * @returns Object containing operation name and tags
 */
function extractMetadata(effect: CommandEffect): {
  operation: string;
  tags: Record<string, string>;
} {
  return {
    operation: effect.metadata?.operation ?? "unknown",
    tags: effect.metadata?.tags ?? {},
  };
}

/**
 * Handles exceptions thrown during command execution
 * Converts exceptions to typed Failure effects
 *
 * @param error - The exception that was thrown
 * @param execCtx - Execution context
 * @returns Failure effect with COMMAND_EXECUTION_ERROR
 */
function handleCommandException(error: unknown, execCtx: ExecutionContext): Failure {
  const updatedExecCtx = calculateDuration(execCtx);
  const { ctx, duration, operation, span, tags } = updatedExecCtx;

  // Log error at ERROR level (system errors, not business failures)
  logError(ctx, span, operation, tags, duration, error);

  // Convert exception to typed Failure effect
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  return failure({
    code: "COMMAND_EXECUTION_ERROR",
    context: {
      operation,
      originalError: errorMessage,
    },
    message: errorMessage,
  });
}

/**
 * Initializes execution context with instrumentation
 *
 * @param effect - CommandEffect being executed
 * @returns Promise resolving to execution context
 */
async function initializeExecutionContext(effect: CommandEffect): Promise<ExecutionContext> {
  const startTime = Date.now();
  const { operation, tags } = extractMetadata(effect);

  // Load instrumentation context (lazy loading via dynamic imports)
  const ctx = await loadInstrumentationContext();

  // Log start and create distributed tracing span
  const span = logStart(ctx, operation, tags);

  return {
    ctx,
    duration: 0, // Will be calculated later
    operation,
    span,
    startTime,
    tags,
  };
}

/**
 * Logs and records failure metrics for an Effect that returned Failure
 *
 * @param execCtx - Execution context
 * @param failureEffect - The Failure effect to log
 */
function logAndRecordFailure(execCtx: ExecutionContext, failureEffect: Failure): void {
  const { ctx, duration, operation, span, tags } = execCtx;

  // Log failure details at WARN level (business failures, not system errors)
  if (ctx.logger) {
    ctx.logger.warn(
      {
        duration,
        error: failureEffect.error,
        errorCode: failureEffect.error.code,
        errorMessage: failureEffect.error.message,
        operation,
        requestId: ctx.getRequestId?.(),
        tags,
      },
      `Effect returned Failure: ${operation}`,
    );
  }

  // Record failure metrics in Prometheus
  if (ctx.recordEffectMetrics && ctx.recordEffectError) {
    const domain = tags.domain || "unknown";
    ctx.recordEffectMetrics(operation, domain, duration, "failure");
    ctx.recordEffectError(operation, domain, failureEffect.error.code);
  }

  // End tracing span normally (business failures are not system errors)
  if (span && ctx.endSpan) {
    ctx.endSpan(span);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Processes the final effect result after execution
 * Routes to appropriate logging/metrics based on Success or Failure status
 *
 * @param execCtx - Execution context
 * @param finalEffect - Final effect result to process
 */
function processEffectResult<T>(execCtx: ExecutionContext, finalEffect: Effect<T>): void {
  if (finalEffect.status === "Failure") {
    logAndRecordFailure(execCtx, finalEffect);
  } else if (finalEffect.status === "Success") {
    const { ctx, duration, operation, span, tags } = execCtx;
    logSuccess(ctx, span, operation, tags, duration);
  }
}