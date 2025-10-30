import { z } from "zod";

import { Effect, fail, success } from "#lib/effect/index";

/**
 * Email Value Object (opaque branded type)
 *
 * Represents a validated email address in the domain.
 * Immutable by design - once created, the value cannot be changed.
 */
export type Email = string & { readonly __brand: unique symbol };

/**
 * Email Value Object operations
 *
 * Provides factory function for creating validated Email instances
 * and behavior methods for working with Email values.
 */
export const Email = {
  /**
   * Creates a validated Email Value Object
   *
   * @param value - The email string to validate
   * @returns Effect<Email> - Success with Email or Failure with validation error
   *
   * @example
   * ```ts
   * const emailEffect = Email.create("user@example.com");
   * const result = await runEffect(emailEffect);
   * if (result.status === "Success") {
   *   const domain = Email.domain(result.value); // "example.com"
   * }
   * ```
   */
  create: (value: string): Effect<Email> => {
    const emailSchema = z.email();
    const result = emailSchema.safeParse(value);

    if (!result.success) {
      return fail({
        code: "VALIDATION_ERROR",
        field: "email",
        message: "Invalid email format",
      });
    }

    return success(result.data as Email);
  },

  /**
   * Extracts the domain part of an email address
   *
   * @param email - Valid Email Value Object
   * @returns The domain portion (everything after @)
   *
   * @example
   * ```ts
   * Email.domain(email); // "example.com" for "user@example.com"
   * ```
   */
  domain: (email: Email): string => {
    const emailStr = email as string;
    const atIndex = emailStr.indexOf("@");
    return emailStr.substring(atIndex + 1);
  },

  /**
   * Extracts the local part of an email address
   *
   * @param email - Valid Email Value Object
   * @returns The local portion (everything before @)
   *
   * @example
   * ```ts
   * Email.localPart(email); // "user" for "user@example.com"
   * ```
   */
  localPart: (email: Email): string => {
    const emailStr = email as string;
    const atIndex = emailStr.indexOf("@");
    return emailStr.substring(0, atIndex);
  },

  /**
   * Converts Email Value Object to string representation
   *
   * @param email - Valid Email Value Object
   * @returns The email as a plain string
   *
   * @example
   * ```ts
   * Email.toString(email); // "user@example.com"
   * ```
   */
  toString: (email: Email): string => {
    return email as string;
  },
};