import { type Effect, fail, success } from "#lib/effect/index";
import { chain } from "#lib/effect/combinators";

import type { LoginInput } from "./types/login";
import { Email } from "./value-objects/Email";
import { HashedPassword } from "./value-objects/Password";
import { findByEmail } from "./find.operations";

/**
 * Validates login input
 * Creates Email Value Object
 */
export function validateLogin(input: LoginInput): Effect<{
  email: Email;
  plainPassword: string;
}> {
  return chain(Email.create(input.email), (email) =>
    success({
      email,
      plainPassword: input.password,
    }),
  );
}

/**
 * Finds user by email and returns full User entity (including password)
 * Used for authentication purposes
 */
export function findUserByEmailForLogin(data: {
  email: Email;
  plainPassword: string;
}): Effect<{
  email: Email;
  plainPassword: string;
  hashedPassword: string;
  userId: number;
  userName: string | null;
  userEmail: string;
}> {
  return chain(findByEmail(data.email), (user) => {
    if (!user) {
      return fail({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    return success({
      email: data.email,
      plainPassword: data.plainPassword,
      hashedPassword: user.password,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    });
  });
}

/**
 * Verifies password against stored hash
 */
export function verifyPassword(data: {
  email: Email;
  plainPassword: string;
  hashedPassword: string;
  userId: number;
  userName: string | null;
  userEmail: string;
}): Effect<{
  userId: number;
  userEmail: string;
  userName: string | null;
}> {
  return chain(
    HashedPassword.verify(data.hashedPassword as HashedPassword, data.plainPassword),
    (isValid) => {
      if (!isValid) {
        return fail({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      return success({
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
      });
    },
  );
}
