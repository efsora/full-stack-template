import { pipe } from "#lib/effect/combinators";
import type { Effect } from "#lib/effect/index";
import { generateAuthToken } from "#infrastructure/auth/token";
import { success } from "#lib/effect/factories";

import type { LoginInput, LoginResult } from "./types/login";
import {
  findUserByEmailForLogin,
  validateLogin,
  verifyPassword,
} from "./login.operations";

/**
 * Login Workflow
 *
 * Orchestrates user authentication with email and password.
 * This is a public operation that authenticates users via the /api/v1/auth/login endpoint.
 *
 * Steps:
 * 1. Validate input (email format, password presence)
 * 2. Find user by email
 * 3. Verify password against stored hash
 * 4. Generate authentication token
 *
 * @param input - Login data (email, password)
 * @returns Effect containing user data with authentication token
 */
export function login(input: LoginInput): Effect<LoginResult> {
  return pipe(
    validateLogin(input),
    findUserByEmailForLogin,
    verifyPassword,
    addAuthToken,
  );
}

/**
 * Adds authentication token to login result
 */
function addAuthToken(result: {
  userId: number;
  userEmail: string;
  userName: string | null;
}): Effect<LoginResult> {
  const token = generateAuthToken(result.userId, result.userEmail);
  return success({
    id: result.userId,
    email: result.userEmail,
    name: result.userName,
    token,
  });
}
