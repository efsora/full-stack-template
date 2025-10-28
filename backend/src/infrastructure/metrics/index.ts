import { env } from "#infrastructure/config/env.js";
import { Counter, Histogram, Registry } from "prom-client";
/**
 * Prometheus metrics registry
 */
export const metricsRegistry = new Registry();
/**
 * HTTP Metrics
 */
export const httpRequestsTotal = new Counter({
  help: "Total number of HTTP requests",
  labelNames: ["method", "path", "status"],
  name: "http_requests_total",
  registers: [metricsRegistry],
});
export const httpRequestDuration = new Histogram({
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  help: "HTTP request duration in seconds",
  labelNames: ["method", "path"],
  name: "http_request_duration_seconds",
  registers: [metricsRegistry],
});
export const httpResponseSize = new Histogram({
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  help: "HTTP response size in bytes",
  labelNames: ["method", "path"],
  name: "http_response_size_bytes",
  registers: [metricsRegistry],
});
/**
 * Effect Metrics
 */
export const effectExecutionsTotal = new Counter({
  help: "Total number of effect executions",
  labelNames: ["operation", "domain", "status"],
  name: "effect_executions_total",
  registers: [metricsRegistry],
});
export const effectDuration = new Histogram({
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  help: "Effect execution duration in seconds",
  labelNames: ["operation", "domain"],
  name: "effect_duration_seconds",
  registers: [metricsRegistry],
});
export const effectErrorsTotal = new Counter({
  help: "Total number of effect errors",
  labelNames: ["operation", "domain", "error_code"],
  name: "effect_errors_total",
  registers: [metricsRegistry],
});
/**
 * Database Metrics
 */
export const dbQueriesTotal = new Counter({
  help: "Total number of database queries",
  labelNames: ["operation", "domain"],
  name: "db_queries_total",
  registers: [metricsRegistry],
});
export const dbQueryDuration = new Histogram({
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  help: "Database query duration in seconds",
  labelNames: ["operation", "domain"],
  name: "db_query_duration_seconds",
  registers: [metricsRegistry],
});
/**
 * Business Metrics
 */
export const usersRegisteredTotal = new Counter({
  help: "Total number of user registrations",
  name: "users_registered_total",
  registers: [metricsRegistry],
});
export const postsCreatedTotal = new Counter({
  help: "Total number of posts created",
  name: "posts_created_total",
  registers: [metricsRegistry],
});
export const commentsCreatedTotal = new Counter({
  help: "Total number of comments created",
  name: "comments_created_total",
  registers: [metricsRegistry],
});
/**
 * Helper function to record business metrics
 */
export function recordBusinessMetric(
  metric: "comments_created" | "posts_created" | "users_registered",
): void {
  if (!env.METRICS_ENABLED) return;
  switch (metric) {
    case "comments_created":
      commentsCreatedTotal.inc();
      break;
    case "posts_created":
      postsCreatedTotal.inc();
      break;
    case "users_registered":
      usersRegisteredTotal.inc();
      break;
  }
}
/**
 * Helper function to record effect errors
 */
export function recordEffectError(operation: string, domain: string, errorCode: string): void {
  if (!env.METRICS_ENABLED) return;
  effectErrorsTotal.inc({ domain, error_code: errorCode, operation });
}
/**
 * Helper function to record effect metrics
 */
export function recordEffectMetrics(
  operation: string,
  domain: string,
  duration: number,
  status: "failure" | "success",
): void {
  if (!env.METRICS_ENABLED) return;
  effectExecutionsTotal.inc({ domain, operation, status });
  effectDuration.observe({ domain, operation }, duration / 1000); // Convert to seconds
  // Record database query metrics for DB operations
  if (["create", "delete", "read", "update"].includes(domain)) {
    dbQueriesTotal.inc({ domain, operation });
    dbQueryDuration.observe({ domain, operation }, duration / 1000);
  }
}