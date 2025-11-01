/**
 * Output types for Users domain
 *
 * These types represent data returned to external consumers (HTTP responses).
 * They typically exclude sensitive fields (e.g., password hashes).
 */

export type CreateUserResult = {
  email: string;
  id: number;
  name: string | null;
  token?: string;
};

/**
 * Public user data (without password field)
 * Safe for API responses
 */
export type PublicUserData = {
  createdAt: Date;
  email: string;
  id: number;
  name: string | null;
  updatedAt: Date;
};

/**
 * Update user result
 * Optionally includes authentication token when generated
 */
export type UpdateUserResult = {
  createdAt: Date;
  email: string;
  id: number;
  name: string | null;
  token?: string;
  updatedAt: Date;
};

/**
 * User data for responses (without password)
 */
export type UserData = {
  createdAt: Date;
  email: string;
  id: number;
  name: string | null;
  updatedAt: Date;
};
