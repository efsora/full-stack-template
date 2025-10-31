import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/**
 * OpenAPI Registry
 * Central registry for all OpenAPI components, paths, and schemas
 */
export const registry = new OpenAPIRegistry();

/**
 * Register Bearer Token Security Scheme
 */
registry.registerComponent("securitySchemes", "BearerAuth", {
  bearerFormat: "JWT",
  description: "JWT authentication token",
  scheme: "bearer",
  type: "http",
});
