import type { NextFunction, Request, Response } from "express";

import { env } from "#infrastructure/config/env.js";
import {
  httpRequestDuration,
  httpRequestsTotal,
  httpResponseSize,
} from "#infrastructure/metrics/index.js";

/**
 * Metrics middleware to collect HTTP request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!env.METRICS_ENABLED) {
    next();
    return;
  }

  const startTime = Date.now();

  // Collect metrics on response finish
  res.on("finish", () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const path = req.route?.path ?? req.path;
    const method = req.method;
    const status = res.statusCode.toString();

    // Record request count
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    httpRequestsTotal.inc({ method, path, status });

    // Record request duration
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    httpRequestDuration.observe({ method, path }, duration);

    // Record response size if available
    const contentLength = res.get("Content-Length");
    if (contentLength) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      httpResponseSize.observe({ method, path }, parseInt(contentLength, 10));
    }
  });

  next();
}