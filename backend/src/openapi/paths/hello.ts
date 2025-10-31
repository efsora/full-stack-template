import { helloResponseSchema } from "#routes/hello/schemas";

import { registry } from "../registry.js";
import { successResponseSchema } from "../schemas.js";

/**
 * GET /api/v1/hello
 * Simple health/test endpoint that returns a greeting message
 */
registry.registerPath({
  description: "Simple health/test endpoint that returns a greeting message",
  method: "get",
  path: "/api/v1/hello",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(helloResponseSchema),
        },
      },
      description: "Successful response",
    },
  },
  summary: "Hello endpoint",
  tags: ["Hello"],
});
