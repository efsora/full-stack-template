import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/**
 * Schema for user registration body
 */
export const registerBodySchema = z
  .object({
    email: z.email("Invalid email format").openapi({ example: "john.doe@example.com" }),
    name: z.string().optional().openapi({ example: "John Doe" }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .openapi({ example: "securePassword123" }),
  })
  .openapi("RegisterBody");

/**
 * Schema for user login body
 */
export const loginBodySchema = z
  .object({
    email: z.email("Invalid email format").openapi({ example: "john.doe@example.com" }),
    password: z.string().min(1, "Password is required").openapi({ example: "securePassword123" }),
  })
  .openapi("LoginBody");

/**
 * User response schema (without password)
 */
export const userResponseSchema = z
  .object({
    createdAt: z.iso.datetime().openapi({ example: "2025-10-04T10:30:00.000Z" }),
    email: z.email().openapi({ example: "john.doe@example.com" }),
    id: z.number().int().positive().openapi({ example: 1 }),
    name: z.string().nullable().openapi({ example: "John Doe" }),
    updatedAt: z.iso.datetime().openapi({ example: "2025-10-04T10:30:00.000Z" }),
  })
  .openapi("UserResponse");

/**
 * Auth response schema with token
 */
export const authResponseSchema = z
  .object({
    token: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
    user: userResponseSchema,
  })
  .openapi("AuthResponse");

/**
 * Validation schemas for routes
 */
export const registerSchema = {
  body: registerBodySchema,
};

export const loginSchema = {
  body: loginBodySchema,
};

export type AuthResponse = z.infer<typeof authResponseSchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;