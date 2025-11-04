import type { NextFunction, Request, Response } from "express";

import { requestContext } from "#infrastructure/logger/context";
import { logger } from "#infrastructure/logger/index";
import {
  sanitizeBody,
  sanitizeHeaders,
  sanitizeQuery,
} from "#middlewares/utils/sanitize";
import { trace } from "@opentelemetry/api";
import { randomUUID } from "node:crypto";

/**
 * Request logging middleware with correlation ID
 * Generates unique request ID and logs all HTTP requests/responses
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = randomUUID();
  const startTime = Date.now();

  // Extract trace ID from OpenTelemetry span context (if available)
  const activeSpan = trace.getActiveSpan();
  const spanContext = activeSpan?.spanContext();
  const traceId = spanContext?.traceId ?? requestId; // Fall back to requestId if no span
  const spanId = spanContext?.spanId;

  // Create request context with correlation IDs
  requestContext.run({ requestId, spanId, traceId }, () => {
    // Log request start (with sensitive data redacted)
    logger.info(
      {
        body: sanitizeBody(req.body),
        headers: sanitizeHeaders(req.headers as Record<string, unknown>),
        method: req.method,
        path: req.path,
        query: sanitizeQuery(req.query as Record<string, unknown>),
        requestId,
        spanId,
        traceId,
      },
      "Incoming request",
    );

    // Log response on finish
    res.on("finish", () => {
      const duration = Date.now() - startTime;

      logger.info(
        {
          duration,
          method: req.method,
          path: req.path,
          requestId,
          spanId,
          status: res.statusCode,
          traceId,
        },
        "Request completed",
      );
    });

    next();
  });
}
