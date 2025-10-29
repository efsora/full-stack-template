/**
 * Effect System Instrumentation (Imperative Shell)
 *
 * Observability integration for the effect system.
 * Handles logging, metrics, and distributed tracing for effect executions.
 *
 * This module is in the infrastructure layer (imperative shell) because it:
 * - Performs side effects (logging, metrics, tracing)
 * - Interacts with external services
 * - Uses dynamic imports for lazy loading
 * - Has no business logic
 */

import type { Logger } from "pino";

import { context, type Span, trace } from "@opentelemetry/api";

/**
 * Context for observability instrumentation (logging, metrics, tracing).
 * All fields are nullable to support graceful degradation when modules are unavailable.
 */
export interface InstrumentationContext {
  createSpan: ((name: string, attributes?: Record<string, string>) => Span) | null;
  endSpan: ((span: Span) => void) | null;
  endSpanWithError: ((span: Span, error: Error | string) => void) | null;
  getRequestId: (() => string | undefined) | null;
  logger: Logger | null;
  recordEffectError: ((operation: string, domain: string, errorCode: string) => void) | null;
  recordEffectMetrics:
    | ((operation: string, domain: string, duration: number, status: "failure" | "success") => void)
    | null;
}

/**
 * Lazy loads observability modules to avoid circular dependencies.
 * Returns null for each module that fails to load.
 *
 * Uses dynamic imports to:
 * - Avoid circular dependencies between core and services
 * - Support graceful degradation when observability services unavailable
 * - Defer loading until actually needed (when runEffect is called)
 *
 * @returns Instrumentation context with loaded modules
 */
export async function loadInstrumentationContext(): Promise<InstrumentationContext> {
  let logger: Logger | null = null;
  let getRequestId: (() => string | undefined) | null = null;
  let recordEffectMetrics:
    | ((operation: string, domain: string, duration: number, status: "failure" | "success") => void)
    | null = null;
  let recordEffectError: ((operation: string, domain: string, errorCode: string) => void) | null =
    null;
  let createSpan: ((name: string, attributes?: Record<string, string>) => Span) | null = null;
  let endSpan: ((span: Span) => void) | null = null;
  let endSpanWithError: ((span: Span, error: Error | string) => void) | null = null;

  try {
    const loggerModule = await import("#infrastructure/logger/index");
    const contextModule = await import("#infrastructure/logger/context");
    const metricsModule = await import("#infrastructure/metrics/index");
    const tracingModule = await import("#infrastructure/tracing/index");

    logger = loggerModule.logger;
    getRequestId = contextModule.getRequestId;
    recordEffectMetrics = metricsModule.recordEffectMetrics;
    recordEffectError = metricsModule.recordEffectError;
    createSpan = tracingModule.createSpan;
    endSpan = tracingModule.endSpan;
    endSpanWithError = tracingModule.endSpanWithError;
  } catch {
    // Logger/metrics/tracing not available, graceful degradation
  }

  return {
    createSpan,
    endSpan,
    endSpanWithError,
    getRequestId,
    logger,
    recordEffectError,
    recordEffectMetrics,
  };
}

/**
 * Logs effect execution error, records error metrics, and ends tracing span with error.
 *
 * @param ctx - Instrumentation context
 * @param span - Tracing span (if created)
 * @param operation - Operation name
 * @param tags - Operation tags
 * @param duration - Execution duration in milliseconds
 * @param error - Error that occurred
 */
export function logError(
  ctx: InstrumentationContext,
  span: null | Span,
  operation: string,
  tags: Record<string, string>,
  duration: number,
  error: unknown,
): void {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log error with stack trace
  if (ctx.logger) {
    ctx.logger.error(
      {
        duration,
        error: errorMessage,
        operation,
        requestId: ctx.getRequestId?.(),
        stack: errorStack,
        tags,
      },
      `Effect execution failed: ${operation}`,
    );
  }

  // Record error metrics
  if (ctx.recordEffectMetrics && ctx.recordEffectError) {
    ctx.recordEffectMetrics(operation, tags.domain || "unknown", duration, "failure");
    // Extract error code if available from the error
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "COMMAND_EXECUTION_ERROR";
    ctx.recordEffectError(operation, tags.domain || "unknown", errorCode);
  }

  // End span with error
  if (span && ctx.endSpanWithError) {
    ctx.endSpanWithError(span, error instanceof Error ? error : new Error(errorMessage));
  }
}

/**
 * Logs effect execution start and creates distributed tracing span.
 *
 * @param ctx - Instrumentation context
 * @param operation - Operation name (e.g., "findUserById")
 * @param tags - Operation tags (domain, action, etc.)
 * @returns Created span (or null if tracing unavailable)
 */
export function logStart(
  ctx: InstrumentationContext,
  operation: string,
  tags: Record<string, string>,
): null | Span {
  // Create tracing span
  let span: null | Span = null;
  if (ctx.createSpan) {
    span = ctx.createSpan(`effect.${operation}`, {
      "effect.domain": tags.domain || "unknown",
      "effect.operation": operation,
    });
  }

  // Log effect execution start
  if (ctx.logger) {
    ctx.logger.debug(
      {
        operation,
        requestId: ctx.getRequestId?.(),
        tags,
      },
      `Effect execution started: ${operation}`,
    );
  }

  return span;
}

/**
 * Logs effect execution success, records metrics, and ends tracing span.
 *
 * @param ctx - Instrumentation context
 * @param span - Tracing span (if created)
 * @param operation - Operation name
 * @param tags - Operation tags
 * @param duration - Execution duration in milliseconds
 */
export function logSuccess(
  ctx: InstrumentationContext,
  span: null | Span,
  operation: string,
  tags: Record<string, string>,
  duration: number,
): void {
  // Log effect execution success
  if (ctx.logger) {
    ctx.logger.debug(
      {
        duration,
        operation,
        requestId: ctx.getRequestId?.(),
        status: "success",
        tags,
      },
      `Effect execution completed: ${operation}`,
    );
  }

  // Record metrics
  if (ctx.recordEffectMetrics) {
    ctx.recordEffectMetrics(operation, tags.domain || "unknown", duration, "success");
  }

  // End span with success
  if (span && ctx.endSpan) {
    ctx.endSpan(span);
  }
}

/**
 * Wraps an async operation in span context for propagation.
 * Sets the given span as active in the OpenTelemetry context, ensuring all child
 * operations (including nested effect executions) inherit this span as their parent.
 *
 * This enables automatic span hierarchy in distributed tracing:
 * - HTTP request span (auto-instrumented)
 *   └── Effect span (this function sets it active)
 *       └── Nested effect spans (automatically linked)
 *
 * @param span - Span to set as active context (null if tracing unavailable)
 * @param fn - Async operation to execute within span context
 * @returns Promise resolving to operation result
 *
 * @example
 * ```ts
 * const span = createSpan("effect.register");
 * return withSpanContext(span, async () => {
 *   // All work here runs with span as active context
 *   const result = await executeCommand();
 *   endSpan(span);
 *   return result;
 * });
 * ```
 */
export async function withSpanContext<T>(span: null | Span, fn: () => Promise<T>): Promise<T> {
  if (!span) {
    // No span available (tracing disabled or unavailable), execute without context
    return fn();
  }

  // Set span as active in context and execute operation
  // All async operations within fn() will inherit this span as parent
  return context.with(trace.setSpan(context.active(), span), fn);
}