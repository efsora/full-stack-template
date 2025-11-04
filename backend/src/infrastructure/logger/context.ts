import { AsyncLocalStorage } from "node:async_hooks";
/**
 * Request context type for correlation
 */
export type RequestContext = {
  requestId: string;
  spanId?: string;
  traceId?: string;
};
/**
 * AsyncLocalStorage for request context propagation
 * Allows access to request ID and trace context from anywhere in the request lifecycle
 */
export const requestContext = new AsyncLocalStorage<RequestContext>();
/**
 * Get current request context
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}
/**
 * Get request ID from current context
 */
export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}
/**
 * Get span ID from current context
 */
export function getSpanId(): string | undefined {
  return requestContext.getStore()?.spanId;
}
/**
 * Get trace ID from current context
 */
export function getTraceId(): string | undefined {
  return requestContext.getStore()?.traceId;
}
