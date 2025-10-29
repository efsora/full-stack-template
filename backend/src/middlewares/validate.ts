import { errorResponse } from "#middlewares/utils/response";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";

/**
 * Zod schema configuration for request validation
 */
export interface ValidationSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

/**
 * Validation middleware factory
 * Automatically parses and validates req.body, req.params, req.query using Zod schemas
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Validate body
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        res.status(400).json(
          errorResponse(
            "Validation failed",
            "VALIDATION_ERROR",
            result.error.issues.map((issue) => ({
              message: issue.message,
              path: issue.path.join("."),
            })),
          ),
        );
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      req.body = result.data as Request["body"];
    }

    // Validate params
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        res.status(400).json(
          errorResponse(
            "Validation failed",
            "VALIDATION_ERROR",
            result.error.issues.map((issue) => ({
              message: issue.message,
              path: issue.path.join("."),
            })),
          ),
        );
        return;
      }
      // Avoid reassigning req.params (getter-only in Express 5)
      Object.assign(req.params as unknown as object, result.data as object);
    }

    // Validate query
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        res.status(400).json(
          errorResponse(
            "Validation failed",
            "VALIDATION_ERROR",
            result.error.issues.map((issue) => ({
              message: issue.message,
              path: issue.path.join("."),
            })),
          ),
        );
        return;
      }
      // Avoid reassigning req.query (getter-only in Express 5)
      Object.assign(req.query as unknown as object, result.data as object);
    }

    next();
  };
}