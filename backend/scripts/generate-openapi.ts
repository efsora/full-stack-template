import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// Import all route schemas
import {
  authResponseSchema,
  loginBodySchema,
  registerBodySchema,
} from "../src/routes/auth/schemas";
import { helloResponseSchema } from "../src/routes/hello/schemas";
import {
  createUserBodySchema,
  createUserResponseSchema,
  getUserParamsSchema,
  userDataSchema,
} from "../src/routes/users/schemas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create OpenAPI registry
const registry = new OpenAPIRegistry();

// Register security scheme
registry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT authentication token",
});

// Standard response wrappers
const successResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    status: z.literal("success"),
    data: dataSchema,
  });

const errorResponseSchema = z.object({
  status: z.literal("error"),
  code: z.string().openapi({ example: "VALIDATION_ERROR" }),
  message: z.string().openapi({ example: "Validation failed" }),
  details: z.any().optional().openapi({ type: "object" }),
});

// Register health endpoint
registry.registerPath({
  method: "get",
  path: "/health",
  summary: "Health check",
  description: "Check if the server is running and healthy",
  tags: ["System"],
  responses: {
    200: {
      description: "Server is healthy",
      content: {
        "application/json": {
          schema: z.object({
            status: z.literal("ok").openapi({ example: "ok" }),
            message: z.string().openapi({ example: "Server is healthy" }),
            timestamp: z.string().openapi({ example: "2025-10-29T10:30:00.000Z" }),
          }),
        },
      },
    },
  },
});

// Register hello endpoint
registry.registerPath({
  method: "get",
  path: "/api/v1/hello",
  summary: "Hello endpoint",
  description: "Simple health/test endpoint that returns a greeting message",
  tags: ["Hello"],
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: successResponseSchema(helloResponseSchema),
        },
      },
    },
  },
});

// Register create user endpoint
registry.registerPath({
  method: "post",
  path: "/api/v1/users",
  summary: "Create user",
  description: "Register a new user account",
  tags: ["Users"],
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
      description: "User created successfully",
      content: {
        "application/json": {
          schema: successResponseSchema(createUserResponseSchema),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: "User already exists",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// Register get user by ID endpoint
registry.registerPath({
  method: "get",
  path: "/api/v1/users/{id}",
  summary: "Get user by ID",
  description: "Retrieve user information by ID. Users can only access their own data.",
  tags: ["Users"],
  security: [{ BearerAuth: [] }],
  request: {
    params: getUserParamsSchema,
  },
  responses: {
    200: {
      description: "User found",
      content: {
        "application/json": {
          schema: successResponseSchema(userDataSchema),
        },
      },
    },
    401: {
      description: "Unauthorized - No or invalid token",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Cannot access another user's data",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// Register auth endpoints
registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  summary: "Register user",
  description: "Register a new user account (auth endpoint)",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Registration successful",
      content: {
        "application/json": {
          schema: successResponseSchema(authResponseSchema),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  summary: "Login",
  description: "Authenticate with email and password",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: successResponseSchema(authResponseSchema),
        },
      },
    },
    401: {
      description: "Invalid credentials",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// Generate OpenAPI document
const generator = new OpenApiGeneratorV31(registry.definitions);
const document = generator.generateDocument({
  openapi: "3.1.0",
  info: {
    title: "Full Stack Template API",
    version: "1.0.0",
    description: "API documentation for the Full Stack Template backend service",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  tags: [
    {
      name: "System",
      description: "System health and status endpoints",
    },
    {
      name: "Hello",
      description: "Health check and test endpoints",
    },
    {
      name: "Users",
      description: "User management endpoints",
    },
    {
      name: "Auth",
      description: "Authentication endpoints",
    },
  ],
});

// Write to file
const outputPath = path.join(__dirname, "../../_docs/openapi.json");
const outputDir = path.dirname(outputPath);

// Ensure the directory exists
fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

console.log(`✅ OpenAPI spec generated at: ${outputPath}`);
