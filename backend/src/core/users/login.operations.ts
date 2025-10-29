import { User, users } from "#db/schema";
import { userRepository } from "#infrastructure/repositories/drizzle";
import bcrypt from "bcrypt";
import first from "lodash/fp/first";
import { z } from "zod";

import { commandEffect, Effect, failure, success } from "#lib/effect/index";
import { LoginInput } from "#core/users/types/inputs";
import { LoginResult } from "#core/users/types/outputs";

/**
 * Finds user by email using repository
 * Returns CommandEffect that queries the database via infrastructure layer
 */
export function findUserByEmail(
  input: LoginInput,
): Effect<{ input: LoginInput; user: User }> {
  return commandEffect<User | undefined, { input: LoginInput; user: User }>(
    async (): Promise<User | undefined> => {
      const foundUsers = await userRepository.findByEmail(input.email);
      return first(foundUsers);
    },
    (user: undefined | User) => {
      if (!user) {
        return failure({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }
      return success({ input, user });
    },
    {
      operation: "findUserByEmail",
      tags: { action: "read", domain: "users" },
    },
  );
}

/**
 * Validates login input
 * Pure function - no side effects
 */
export function validateLogin(input: LoginInput): Effect<LoginInput> {
  const { email, password } = input;

  // Validate email format using Zod
  const emailResult = z.email().safeParse(email);
  if (!emailResult.success) {
    return failure({
      code: "VALIDATION_ERROR",
      field: "email",
      message: "Invalid email format",
    });
  }

  if (!password) {
    return failure({
      code: "VALIDATION_ERROR",
      field: "password",
      message: "Password is required",
    });
  }

  return success(input);
}

/**
 * Verifies password matches
 * Returns CommandEffect that compares passwords
 */
export function verifyPassword(data: {
  input: LoginInput;
  user: typeof users.$inferSelect;
}): Effect<LoginResult> {
  return commandEffect(
    async () => {
      const isValid = await bcrypt.compare(data.input.password, data.user.password);
      return isValid;
    },
    (isValid) => {
      if (!isValid) {
        return failure({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }
      return success({
        email: data.user.email,
        id: data.user.id,
        name: data.user.name,
      });
    },
    {
      operation: "verifyPassword",
      tags: { action: "hash", domain: "users" },
    },
  );
}