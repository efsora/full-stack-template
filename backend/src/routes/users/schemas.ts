import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/**
 * Schema for user creation body
 */
export const createUserBodySchema = z
  .object({
    email: z.string().email("Invalid email format").openapi({ example: "jane.doe@example.com" }),
    name: z.string().min(1, "Name is required").openapi({ example: "Jane Doe" }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .openapi({ example: "securePassword123" }),
  })
  .openapi("CreateUserBody");

/**
 * Schema for user ID parameter
 */
export const getUserParamsSchema = z
  .object({
    id: z.coerce.number().int().positive().openapi({ example: 1 }),
  })
  .openapi("GetUserParams");

/**
 * User response schema (without password)
 */
export const userDataSchema = z
  .object({
    createdAt: z.coerce.date().openapi({ example: "2025-10-29T10:30:00.000Z" }),
    email: z.string().email().openapi({ example: "jane.doe@example.com" }),
    id: z.number().int().positive().openapi({ example: 1 }),
    name: z.string().nullable().openapi({ example: "Jane Doe" }),
    updatedAt: z.coerce.date().openapi({ example: "2025-10-29T10:30:00.000Z" }),
  })
  .openapi("UserData");

/**
 * Create user response schema (with token)
 */
export const createUserResponseSchema = z
  .object({
    email: z.string().email().openapi({ example: "jane.doe@example.com" }),
    id: z.number().int().positive().openapi({ example: 1 }),
    name: z.string().nullable().openapi({ example: "Jane Doe" }),
    token: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
  })
  .openapi("CreateUserResponse");

/**
 * Validation schemas for routes
 */
export const createUserSchema = {
  body: createUserBodySchema,
};

export const getUserSchema = {
  params: getUserParamsSchema,
};

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;
export type GetUserParams = z.infer<typeof getUserParamsSchema>;
export type UserDataResponse = z.infer<typeof userDataSchema>;
