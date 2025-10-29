
import type { RegisterBody } from "#routes/auth/schemas";

import { type Effect, pipe, success } from "#lib/effect/index";
import { generateAuthToken } from "#infrastructure/auth/index";

import {
  checkEmailAvailability,
  hashPasswordVO,
  saveUserVO,
  validateRegistration,
} from "#core/users/register.operations";
import { RegisterResult } from "./types/outputs.js";

/**
 * Complete registration workflow
 * Orchestrates: validation → check email availability → hash password → save user → generate token
 *
 * @param body - Registration data (email, password, optional name)
 * @returns Effect with user data and authentication token
 */
export function register(body: RegisterBody): Effect<RegisterResult> {
  return pipe(
    validateRegistration(body),
    checkEmailAvailability,
    hashPasswordVO,
    saveUserVO,
    addAuthToken,
  );
}

/**
 * Adds authentication token to registration result
 * Business logic: "A newly registered user receives an authentication token"
 */
function addAuthToken(user: {
  email: string;
  id: number;
  name: null | string;
}): Effect<RegisterResult> {
  const token = generateAuthToken(user.id, user.email);
  return success({ email: user.email, id: user.id, name: user.name, token });
}
