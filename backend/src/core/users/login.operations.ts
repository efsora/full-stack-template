import type { User } from "#db/schema";
import { generateAuthToken } from "#infrastructure/auth/token";
import { command, type Result, fail, success, pipe, chain } from "#lib/result/index";

import type { LoginInput } from "./types/inputs";
import type { LoginResult } from "./types/outputs";
import { Email } from "./value-objects/Email";
import { HashedPassword } from "./value-objects/Password";
import { findByEmail } from "./find.operations";
import { mapUserToUserData } from "./mappers";

/**
 * Validates login input (email + password format)
 * Creates Email value object to ensure valid email format
 */
export function validateLoginInput(input: LoginInput): Result<LoginInput> {
  // Email validation through value object creation
  return pipe(
    Email.create(input.email),
    () => success(input),
  );
}

/**
 * Finds user by email during login
 * Returns the full User entity (including password hash) for authentication
 */
export function findUserByEmailForLogin(
  input: LoginInput,
): Result<{ input: LoginInput; user: User }> {
  return pipe(
    Email.create(input.email),
    findByEmail,
    (user) => {
      if (!user) {
        return fail({
          code: "USER_INVALID_CREDENTIALS",
          message: "Invalid email or password",
        });
      }
      return success({ input, user });
    },
  );
}

/**
 * Continuation function for verifying password during login
 */
export function handlePasswordVerificationResult(
  data: { input: LoginInput; user: User },
  isValid: boolean,
): Result<{ user: User }> {
  if (!isValid) {
    return fail({
      code: "USER_INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });
  }
  return success({ user: data.user });
}

/**
 * Verifies plain-text password against hashed password
 * Uses Password Value Object's verify method
 */
export function verifyLoginPassword(
  data: { input: LoginInput; user: User },
): Result<{ user: User }> {
  return chain(
    HashedPassword.verify(data.user.password as HashedPassword, data.input.password),
    (isValid: boolean) => handlePasswordVerificationResult(data, isValid),
  );
}

/**
 * Continuation function for adding auth token to login result
 */
export function handleAddAuthTokenToLoginResult(
  user: User,
): Result<LoginResult> {
  const token = generateAuthToken(user.id, user.email);
  return success({
    user: mapUserToUserData(user),
    token,
  });
}

/**
 * Generates JWT token and returns login result
 */
export function addAuthTokenToLogin(data: {
  user: User;
}): Result<LoginResult> {
  return command(
    async () => {
      // Return the user from async context for command execution
      return await Promise.resolve(data.user);
    },
    handleAddAuthTokenToLoginResult,
    {
      operation: "generateLoginToken",
      tags: { action: "create", domain: "users" },
    },
  );
}
