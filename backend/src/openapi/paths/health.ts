import { z } from "zod";

import { registry } from "../registry.js";

/**
 * Health Check Response Schema
 */
const healthResponseSchema = z.object({
  message: z.string().openapi({ example: "Server is healthy" }),
  status: z.literal("ok").openapi({ example: "ok" }),
  timestamp: z.string().openapi({ example: "2025-10-31T10:30:00.000Z" }),
});

/**
 * GET /health
 * Health check endpoint
 */
registry.registerPath({
  description: "Check if the server is running and healthy",
  method: "get",
  path: "/health",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: healthResponseSchema,
        },
      },
      description: "Server is healthy",
    },
  },
  summary: "Health check",
  tags: ["System"],
});
