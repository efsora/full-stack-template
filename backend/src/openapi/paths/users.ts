import {
  createUserBodySchema,
  createUserResponseSchema,
  getUserParamsSchema,
  userDataSchema,
} from "#routes/users/schemas";

import { registry } from "../registry.js";
import { commonErrorResponses, successResponseSchema } from "../schemas.js";

/**
 * POST /api/v1/users
 * Create a new user (register)
 */
registry.registerPath({
  description: "Register a new user account",
  method: "post",
  path: "/api/v1/users",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createUserBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(createUserResponseSchema),
        },
      },
      description: "User created successfully",
    },
    400: commonErrorResponses[400],
    409: commonErrorResponses[409],
    500: commonErrorResponses[500],
  },
  summary: "Create user",
  tags: ["Users"],
});

/**
 * GET /api/v1/users/{id}
 * Get user by ID (authenticated users only, can only access own data)
 */
registry.registerPath({
  description:
    "Retrieve user information by ID. Users can only access their own data.",
  method: "get",
  path: "/api/v1/users/{id}",
  request: {
    params: getUserParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(userDataSchema),
        },
      },
      description: "User found",
    },
    401: commonErrorResponses[401],
    403: commonErrorResponses[403],
    404: commonErrorResponses[404],
    500: commonErrorResponses[500],
  },
  security: [{ BearerAuth: [] }],
  summary: "Get user by ID",
  tags: ["Users"],
});
