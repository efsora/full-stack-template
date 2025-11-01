import { errorResponse } from "#middlewares/utils/response";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";

/**
 * Request type extended with validated data from Zod schemas.
 * Use this type in handlers to access type-safe validated inputs.
 *
 * @example
 * ```typescript
 * import type { CreateUserBody } from "./schemas";
 *
 * export async function handleCreateUser(
 *   req: ValidatedRequest<{ body: CreateUserBody }>
 * ): Promise<AppResponse<...>> {
 *   const body = req.validated.body; // Typed as CreateUserBody
 *   // ...
 * }
 * ```
 */
export type ValidatedRequest<T = Record<string, unknown>> = Request & {
  validated: T;
};

/**
 * Zod schema configuration for request validation.
 */
export type ValidationSchemas = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

/**
 * Validation middleware factory
 * Validates req.body, req.params, req.query using Zod schemas and populates req.validated.
 * Handlers should access validated data via req.validated.body/params/query for type safety.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Initialize validated object
    const validated: Record<string, unknown> = {};

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
      // Populate req.validated.body with type-safe validated data
      validated.body = result.data;
      // Keep backward compatibility (can be removed later)
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
      // Populate req.validated.params with type-safe validated data
      validated.params = result.data;
      // Keep backward compatibility (can be removed later)
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
      // Populate req.validated.query with type-safe validated data
      validated.query = result.data;
      // Keep backward compatibility (can be removed later)
      // Avoid reassigning req.query (getter-only in Express 5)
      Object.assign(req.query as unknown as object, result.data as object);
    }

    // Attach validated data to request
    (req as ValidatedRequest).validated = validated;

    next();
  };
}
