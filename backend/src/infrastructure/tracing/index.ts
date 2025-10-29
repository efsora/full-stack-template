import { env } from "#infrastructure/config/env";
import { context, type Span, SpanStatusCode, trace } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
// Debug: Check raw process.env and parsed env
console.log("[TRACING MODULE] Loading tracing module...");
console.log(
  "[TRACING MODULE] process.env.OTEL_EXPORTER_OTLP_ENDPOINT:",
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
);
console.log("[TRACING MODULE] process.env.ENABLE_TRACING:", process.env.ENABLE_TRACING);
console.log("[TRACING MODULE] env.OTEL_EXPORTER_OTLP_ENDPOINT:", env.OTEL_EXPORTER_OTLP_ENDPOINT);
console.log("[TRACING MODULE] env.ENABLE_TRACING:", env.ENABLE_TRACING);
let sdk: NodeSDK | null = null;
/**
 * Create a span for an operation, linked to the current active context.
 * If there's an active span in the context (e.g., HTTP request span from auto-instrumentation),
 * the new span will be created as a child of that span.
 *
 * @param name - Span name (e.g., "effect.findUserById")
 * @param attributes - Optional span attributes (e.g., {"effect.domain": "users"})
 * @returns Span instance that should be ended via endSpan() or endSpanWithError()
 */
export function createSpan(name: string, attributes?: Record<string, string>): Span {
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
/**
 * Initialize OpenTelemetry SDK
 * Must be called before any other application code
 */
export function initializeTracing(): void {
  console.log("[TRACING DEBUG] ENABLE_TRACING:", env.ENABLE_TRACING);
  console.log("[TRACING DEBUG] OTEL_EXPORTER_OTLP_ENDPOINT:", env.OTEL_EXPORTER_OTLP_ENDPOINT);
  console.log("[TRACING DEBUG] Type:", typeof env.OTEL_EXPORTER_OTLP_ENDPOINT);
  if (!env.ENABLE_TRACING) {
    console.log("Tracing is disabled");
    return;
  }
  // Use OTLP exporter if endpoint is configured, otherwise use console exporter
  const traceExporter = env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? new OTLPTraceExporter({
        url: env.OTEL_EXPORTER_OTLP_ENDPOINT,
      })
    : new ConsoleSpanExporter();
  console.log(
    `Tracing initialized with ${env.OTEL_EXPORTER_OTLP_ENDPOINT ? `OTLP exporter (${env.OTEL_EXPORTER_OTLP_ENDPOINT})` : "Console exporter"}`,
  );
  sdk = new NodeSDK({
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": {
          enabled: false,
        },
      }),
    ],
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: "1.0.0",
    }),
    traceExporter,
  });
  sdk.start();
}
/**
 * Shutdown tracing SDK gracefully
 */
export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
  }
}