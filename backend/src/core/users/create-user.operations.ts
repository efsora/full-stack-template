import type { NewUser } from "#db/schema";
import { userRepository } from "#infrastructure/repositories/drizzle";
import { command, type Result, fail, success } from "#lib/result/index";
import { allNamed, chain } from "#lib/result/combinators";
import first from "lodash/fp/first";

import type { CreateUserInput } from "./types/inputs";
import type { CreateUserResult } from "./types/outputs";
import type { ValidatedCreationData } from "./types/internal";
import { Email } from "./value-objects/Email";
import { HashedPassword, Password } from "./value-objects/Password";
import { findByEmail } from "./find.operations";

/**
 * Validates user creation input
 * Creates Email and Password value objects
 */
export function validateUserCreation(
  input: CreateUserInput,
): Result<ValidatedCreationData> {
  return chain(
    allNamed({
      email: Email.create(input.email),
      password: Password.create(input.password),
    }),
    (result) =>
      success({
        email: result.email,
        name: input.name,
        password: result.password,
      }),
  );
}

/**
 * Checks if email is already registered
 */
export function checkEmailAvailability(
  data: ValidatedCreationData,
): Result<ValidatedCreationData> {
  return chain(findByEmail(data.email), (existingUser) => {
    if (existingUser) {
      return fail({
        code: "USER_EMAIL_ALREADY_EXISTS",
        message: "Email already in use",
      });
    }
    return success(data);
  });
}

/**
 * Hashes password using Password Value Object
 */
export function hashPasswordForCreation(data: ValidatedCreationData): Result<{
  email: Email;
  hashedPassword: HashedPassword;
  name?: string;
}> {
  return chain(Password.hash(data.password), (hashedPassword) =>
    success({
      email: data.email,
      hashedPassword,
      name: data.name,
    }),
  );
}

export function saveNewUser(data: {
  email: Email;
  hashedPassword: HashedPassword;
  name?: string;
}): Result<CreateUserResult> {
  return command(
    async () => {
      const userData: NewUser = {
        email: Email.toString(data.email),
        name: data.name ?? null,
        password: HashedPassword.toString(data.hashedPassword),
      };

      const users = await userRepository.create(userData);
      return first(users);
    },
    (user) => {
      if (!user) {
        return fail({
          code: "INTERNAL_ERROR",
          message: "Failed to create user",
        });
      }

      return success({
        email: user.email,
        id: user.id,
        name: user.name,
      });
    },
    {
      operation: "saveNewUser",
      tags: { action: "create", domain: "users" },
    },
  );
}
