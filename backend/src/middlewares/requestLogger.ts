import type { NextFunction, Request, Response } from "express";

import { requestContext } from "#infrastructure/logger/context";
import { logger } from "#infrastructure/logger/index";
import { randomUUID } from "node:crypto";

/**
 * Request logging middleware with correlation ID
 * Generates unique request ID and logs all HTTP requests/responses
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  const startTime = Date.now();

  // Create request context with correlation ID
  requestContext.run({ requestId }, () => {
    // Log request start
    logger.info(
      {
        body: req.body,
        headers: req.headers,
        method: req.method,
        path: req.path,
        query: req.query,
        requestId,
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
          status: res.statusCode,
        },
        "Request completed",
      );
    });

    next();
  });
}