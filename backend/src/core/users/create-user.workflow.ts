import { pipe } from "#lib/result/combinators";
import type { Result } from "#lib/result/index";
import { generateAuthToken } from "#infrastructure/auth/token";
import { success } from "#lib/result/factories";

import type { CreateUserInput, CreateUserResult } from "./types/create-user";
import {
  checkEmailAvailability,
  hashPasswordForCreation,
  saveNewUser,
  validateUserCreation,
} from "./create-user.operations";

/**
 * Create User Workflow
 *
 * Orchestrates the creation of a new user account.
 * This is a public operation that creates users via the /api/v1/users endpoint.
 *
 * Steps:
 * 1. Validate input (email, password format)
 * 2. Check email availability
 * 3. Hash password
 * 4. Save user to database
 * 5. Generate authentication token
 *
 * @param input - User creation data (email, password, optional name)
 * @returns Result containing user data with authentication token
 */
export function createUser(input: CreateUserInput): Result<CreateUserResult> {
  return pipe(
    validateUserCreation(input),
    checkEmailAvailability,
    hashPasswordForCreation,
    saveNewUser,
    addAuthToken,
  );
}

/**
 * Adds authentication token to user result
 */
function addAuthToken(result: CreateUserResult): Result<CreateUserResult> {
  const token = generateAuthToken(result.id, result.email);
  return success({ ...result, token });
}
