/**
 * Types for user login workflow
 */

/**
 * Input for logging in
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Result after successful login
 */
export interface LoginResult {
  email: string;
  id: number;
  name: null | string;
  token: string;
}
