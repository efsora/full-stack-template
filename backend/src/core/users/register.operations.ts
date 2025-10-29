import type { NewUser, User } from "#db/schema";

import { userRepository } from "#infrastructure/repositories/drizzle";
import bcrypt from "bcrypt";
import first from "lodash/fp/first";

import { allNamed, chain, commandEffect, Effect, failure, pipe, success } from "#lib/effect/index";
import { RegisterInput } from "#core/users/types/inputs";
import { ValidatedRegistrationData } from "#core/users/types/internal";
import { Email } from "#core/users/value-objects/Email";
import { HashedPassword, Password } from "#core/users/value-objects/Password";
import { findByEmail } from "./find.operations";

/**
 * Checks if email already exists in database
 * Returns CommandEffect that queries the database via repository
 *
 * Uses findByEmail() for cleaner composition:
 * - Single chain instead of nested chains
 * - Direct conditional: if user exists, fail; otherwise, succeed
 * - No intermediate objects ({ exists: boolean })
 * - More readable: "find by email → check existence → return result"
 */
export function checkEmailAvailability(
  input: ValidatedRegistrationData,
): Effect<ValidatedRegistrationData> {
  return pipe(
    Email.create(input.email),
    findByEmail,
    (existingUser) => validateEmailNotInUse(existingUser, input),
  );
}

/**
 * @deprecated Use hashPasswordVO with Value Objects instead
 * Legacy function for backward compatibility with user update endpoint
 */
export function hashPassword(input: RegisterInput): Effect<NewUser> {
  return commandEffect(
    () => hashPasswordWithBcrypt(input.password),
    (hashedPassword) => createNewUserData(input, hashedPassword),
    { operation: "hashPassword", tags: { action: "hash", domain: "users" } },
  );
}

/**
 * Hashes the password using Password Value Object
 * Returns CommandEffect that creates HashedPassword
 */
export function hashPasswordVO(
  input: ValidatedRegistrationData,
): Effect<{ email: Email; hashedPassword: HashedPassword; name?: string }> {
  return chain(Password.hash(input.password), (hashedPassword) =>
    createHashedPasswordResult(input, hashedPassword),
  );
}

/**
 * Saves user to database via repository
 * Converts Value Objects to plain strings for database insertion
 */
export function saveUserVO(input: {
  email: Email;
  hashedPassword: HashedPassword;
  name?: string;
}): Effect<{ email: string; id: number; name: null | string }> {
  return commandEffect(() => saveUserToDatabase(input), processSavedUser, {
    operation: "saveUser",
    tags: { action: "create", domain: "users" },
  });
}

// ============================================================================
// Legacy functions for backward compatibility (used by user update endpoint)
// ============================================================================

/**
 * Converts plain registration input to Value Objects
 * Pure function that creates Email and Password Value Objects
 *
 * Uses allNamed() to combine multiple validations in a readable way:
 * - All validations are visible at once (no nested chains)
 * - Named properties make the intent clear
 * - Fails fast if any validation fails
 * - Type-safe result with inferred types
 */
export function validateRegistration(input: RegisterInput): Effect<ValidatedRegistrationData> {
  return chain(
    allNamed({
      email: Email.create(input.email),
      password: Password.create(input.password),
    }),
    createValidatedRegistrationData(input),
  );
}

/**
 * Creates result object with hashed password
 * Private helper for hashPasswordVO
 */
function createHashedPasswordResult(
  input: ValidatedRegistrationData,
  hashedPassword: HashedPassword,
): Effect<{ email: Email; hashedPassword: HashedPassword; name?: string }> {
  return success({
    email: input.email,
    hashedPassword,
    name: input.name,
  });
}

/**
 * Creates NewUser object with hashed password
 * Private helper for hashPassword
 */
function createNewUserData(input: RegisterInput, hashedPassword: string): Effect<NewUser> {
  const userToSave: NewUser = {
    email: input.email,
    name: input.name,
    password: hashedPassword,
  };
  return success(userToSave);
}

/**
 * Creates validated registration data from value objects
 * Private helper for validateRegistration
 */
function createValidatedRegistrationData(
  input: RegisterInput,
): (valueObjects: { email: Email; password: Password }) => Effect<ValidatedRegistrationData> {
  return ({ email, password }) =>
    success({
      email,
      name: input.name,
      password,
    });
}

/**
 * Hashes password using bcrypt
 * Private helper for hashPassword
 */
async function hashPasswordWithBcrypt(password: string): Promise<string> {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
}

/**
 * Processes saved user array from database
 * Private helper for saveUserVO
 */
function processSavedUser(
  savedUsers: User[],
): Effect<{ email: string; id: number; name: null | string }> {
  const savedUser = first(savedUsers);
  if (!savedUser) {
    throw new Error("User not created");
  }
  return success({ email: savedUser.email, id: savedUser.id, name: savedUser.name });
}

/**
 * Saves user data to database
 * Private helper for saveUserVO
 */
async function saveUserToDatabase(input: {
  email: Email;
  hashedPassword: HashedPassword;
  name?: string;
}): Promise<User[]> {
  const userData: NewUser = {
    email: Email.toString(input.email),
    name: input.name,
    password: HashedPassword.toString(input.hashedPassword),
  };

  const savedUsers = await userRepository.create(userData);
  return savedUsers;
}

/**
 * Validates that email is not already in use
 * Private helper for checkEmailAvailability
 */
function validateEmailNotInUse(
  existingUser: undefined | User,
  input: ValidatedRegistrationData,
): Effect<ValidatedRegistrationData> {
  if (existingUser) {
    return failure({
      code: "CONFLICT",
      conflictType: "email",
      email: Email.toString(input.email),
      message: "Email already in use",
    });
  }
  return success(input);
}