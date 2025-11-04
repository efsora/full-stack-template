/**
 * OpenTelemetry Tracing Utilities
 *
 * Provides utilities for creating and managing spans in application code.
 * The SDK initialization happens in src/instrumentation.ts (loaded via --import flag).
 */

import { env } from "#infrastructure/config/env";
import { context, type Span, SpanStatusCode, trace } from "@opentelemetry/api";
/**
 * Create a span for an operation, linked to the current active context.
 * If there's an active span in the context (e.g., HTTP request span from auto-instrumentation),
 * the new span will be created as a child of that span.
 *
 * @param name - Span name (e.g., "effect.findUserById")
 * @param attributes - Optional span attributes (e.g., {"effect.domain": "users"})
 * @returns Span instance that should be ended via endSpan() or endSpanWithError()
 */
export function createSpan(
  name: string,
  attributes?: Record<string, string>,
): Span {
  const tracer = getTracer();
  // Get current active context (may contain parent HTTP span from auto-instrumentation)
  const activeContext = context.active();
  // Create span as child of active context (links to parent span if exists)
  const span = tracer.startSpan(
    name,
    {
      attributes,
    },
    activeContext,
  );
  return span;
}
/**
 * End a span with success status
 */
export function endSpan(span: Span): void {
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}
/**
 * End a span with error status
 */
export function endSpanWithError(span: Span, error: Error | string): void {
  const errorMessage = error instanceof Error ? error.message : error;
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: errorMessage,
  });
  if (error instanceof Error) {
    span.recordException(error);
  }
  span.end();
}
/**
 * Get the current tracer instance
 */
export function getTracer() {
  return trace.getTracer(env.OTEL_SERVICE_NAME, "1.0.0");
}
