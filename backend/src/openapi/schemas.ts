import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { registry } from "./registry.js";

extendZodWithOpenApi(z);

/**
 * Pagination Metadata Schema
 * Matches PaginationMeta from lib/types/response.ts
 */
export const paginationMetaSchema = z
  .object({
    page: z.number().int().positive().openapi({ example: 1 }),
    size: z.number().int().positive().openapi({ example: 10 }),
    total: z.number().int().nonnegative().openapi({ example: 100 }),
  })
  .openapi("PaginationMeta");

/**
 * Cursor Metadata Schema
 * Matches CursorMeta from lib/types/response.ts
 */
export const cursorMetaSchema = z
  .object({
    next_cursor: z.string().nullable().optional().openapi({ example: "abc123" }),
    previous_cursor: z.string().nullable().optional().openapi({ example: "def456" }),
  })
  .openapi("CursorMeta");

/**
 * Response Metadata Schema
 * Matches Meta from lib/types/response.ts
 */
export const metaSchema = z
  .object({
    cursor: cursorMetaSchema.nullable().optional(),
    pagination: paginationMetaSchema.nullable().optional(),
  })
  .openapi("Meta");

/**
 * Error Base Schema
 * Matches ErrorBase from lib/result/types/errors.ts
 */
const errorBaseSchema = z.object({
  context: z.record(z.string(), z.any()).optional(),
  message: z.string(),
  resourceId: z.number().optional(),
  timestamp: z.string().optional().openapi({ example: "2025-10-31T10:30:00.000Z" }),
  userId: z.number().optional(),
});

/**
 * AppError Schema
 * Matches AppError union type from lib/result/types/errors.ts
 */
export const appErrorSchema = z
  .union([
    // CommandExecutionError
    errorBaseSchema.extend({
      code: z.literal("COMMAND_EXECUTION_ERROR"),
    }),
    // ConflictError
    errorBaseSchema.extend({
      code: z.literal("CONFLICT"),
      conflictType: z.enum(["email"]),
      email: z.string().optional(),
    }),
    // ForbiddenError
    errorBaseSchema.extend({
      code: z.literal("FORBIDDEN"),
      resourceId: z.number(),
      resourceType: z.enum(["auth", "comment", "post", "user"]),
    }),
    // InternalError
    errorBaseSchema.extend({
      code: z.literal("INTERNAL_ERROR"),
    }),
    // NotFoundError
    errorBaseSchema.extend({
      code: z.literal("NOT_FOUND"),
      resourceId: z.number(),
      resourceType: z.enum(["auth", "comment", "post", "user"]),
    }),
    // UnauthorizedError
    errorBaseSchema.extend({
      code: z.literal("UNAUTHORIZED"),
    }),
    // ValidationError
    errorBaseSchema.extend({
      code: z.literal("VALIDATION_ERROR"),
      field: z.string(),
    }),
  ])
  .openapi("AppError");

/**
 * Success Response Schema
 * Wraps data in standard AppResponse success format
 * Matches SuccessResponse<T> from lib/types/response.ts
 */
export const successResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    error: z.null().optional(),
    message: z.null().optional(),
    meta: metaSchema.nullable().optional(),
    success: z.literal(true),
    traceId: z.string().openapi({ example: "00-1234567890abcdef-1234567890abcdef-01" }),
  });

/**
 * Paginated Success Response Schema
 * Wraps array data with pagination metadata
 * Matches SuccessResponse<T> with pagination meta from lib/types/response.ts
 */
export const paginatedSuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    error: z.null().optional(),
    message: z.null().optional(),
    meta: z.object({
      cursor: z.null(),
      pagination: paginationMetaSchema,
    }),
    success: z.literal(true),
    traceId: z.string().openapi({ example: "00-1234567890abcdef-1234567890abcdef-01" }),
  });

/**
 * Error Response Schema
 * Matches FailureResponse from lib/types/response.ts
 */
export const errorResponseSchema = z
  .object({
    data: z.null().optional(),
    error: appErrorSchema,
    message: z.string().openapi({ example: "An error occurred" }),
    meta: z.null().optional(),
    success: z.literal(false),
    traceId: z.string().openapi({ example: "00-1234567890abcdef-1234567890abcdef-01" }),
  })
  .openapi("ErrorResponse");

/**
 * Common Error Responses for OpenAPI
 * Standard error responses that can be reused across endpoints
 */
export const commonErrorResponses = {
  400: {
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
    description: "Validation Error - Invalid request body, params, or query",
  },
  401: {
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
    description: "Unauthorized - Invalid or missing authentication token",
  },
  403: {
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
    description: "Forbidden - Insufficient permissions for this resource",
  },
  404: {
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
    description: "Not Found - Requested resource does not exist",
  },
  409: {
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
    description: "Conflict - Resource already exists or conflict occurred",
  },
  500: {
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
    description: "Internal Server Error - Unexpected server error",
  },
};

/**
 * Register Common Components
 */
registry.register("ErrorResponse", errorResponseSchema);
registry.register("PaginationMeta", paginationMetaSchema);
registry.register("CursorMeta", cursorMetaSchema);
registry.register("Meta", metaSchema);
registry.register("AppError", appErrorSchema);
