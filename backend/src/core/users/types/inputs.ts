/**
 * Input types for Users domain
 *
 * These types represent data coming from external sources (HTTP requests, API calls).
 * They are typically validated by Zod schemas in route handlers before reaching the core.
 */

/**
 * Input for creating a new user
 */
export type CreateUserInput = {
  email: string;
  name?: string;
  password: string;
};

/**
 * Update user input data
 */
export type UpdateUserInput = {
  email?: string;
  name?: string;
  password?: string;
};
