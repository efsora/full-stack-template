import type { LoginBody } from "#routes/auth/schemas";

import { type Effect, pipe, success } from "#lib/effect/index";
import { generateAuthToken } from "#infrastructure/auth/index";

import { findUserByEmail, validateLogin, verifyPassword } from "./login.operations";
import { LoginResult } from "./types/outputs";

/**
 * Complete login workflow
 * Orchestrates: validation → find user → verify password → generate token
 *
 * @param body - Login credentials (email, password)
 * @returns Effect with user data and authentication token
 */
export function login(body: LoginBody): Effect<LoginResult> {
  return pipe(validateLogin(body), findUserByEmail, verifyPassword, addAuthToken);
}

/**
 * Adds authentication token to login result
 * Business logic: "A logged-in user receives an authentication token"
 */
function addAuthToken(user: {
  email: string;
  id: number;
  name: null | string;
}): Effect<LoginResult> {
  const token = generateAuthToken(user.id, user.email);
  return success({
    ...user,
    token,
  });
}