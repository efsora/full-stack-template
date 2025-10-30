import bcrypt from "bcrypt";

import { command, Result, fail, success } from "#lib/result/index";

/**
 * HashedPassword Value Object (opaque branded type)
 *
 * Represents a bcrypt-hashed password.
 * Immutable by design and type-safe to prevent using plain passwords where hashed expected.
 */
export type HashedPassword = string & { readonly __brand: unique symbol };

/**
 * Password Value Object (opaque branded type)
 *
 * Represents a validated plain-text password in the domain.
 * Immutable by design - once created, the value cannot be changed.
 */
export type Password = string & { readonly __brand: unique symbol };

/**
 * Password strength level
 */
export type PasswordStrength = "medium" | "strong" | "weak";

/**
 * Password Value Object operations
 *
 * Provides factory function for creating validated Password instances
 * and behavior methods for password operations.
 */
export const Password = {
  /**
   * Creates a validated Password Value Object
   *
   * @param value - The password string to validate
   * @returns Result<Password> - Success with Password or Failure with validation error
   *
   * @example
   * ```ts
   * const passwordEffect = Password.create("mySecurePass123");
   * const result = await runEffect(passwordEffect);
   * if (result.status === "Success") {
   *   const strength = Password.strength(result.value);
   * }
   * ```
   */
  create: (value: string): Result<Password> => {
    if (!value || value.length < 8) {
      return fail({
        code: "VALIDATION_ERROR",
        field: "password",
        message: "Password must be at least 8 characters long",
      });
    }

    return success(value as Password);
  },

  /**
   * Hashes a password using bcrypt
   *
   * @param password - Valid Password Value Object
   * @returns Result<HashedPassword> - Command that performs hashing
   *
   * @example
   * ```ts
   * const hashEffect = Password.hash(password);
   * const result = await runEffect(hashEffect);
   * if (result.status === "Success") {
   *   const hashed = result.value; // HashedPassword
   * }
   * ```
   */
  hash: (password: Password): Result<HashedPassword> => {
    return command(
      async () => {
        const hashedValue = await bcrypt.hash(password as string, 10);
        return hashedValue;
      },
      (hashedValue: string) => success(hashedValue as HashedPassword),
      { operation: "hashPassword", tags: { action: "hash", domain: "users" } },
    );
  },

  /**
   * Calculates password strength based on character composition
   *
   * Algorithm:
   * - Weak: Only letters OR only numbers
   * - Medium: Letters AND numbers
   * - Strong: Letters, numbers, AND special characters
   *
   * @param password - Valid Password Value Object
   * @returns PasswordStrength level
   *
   * @example
   * ```ts
   * Password.strength(password); // 'weak' | 'medium' | 'strong'
   * ```
   */
  strength: (password: Password): PasswordStrength => {
    const passwordStr = password as string;

    const hasLetters = /[a-zA-Z]/.test(passwordStr);
    const hasNumbers = /[0-9]/.test(passwordStr);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(passwordStr);

    // Strong: all three categories
    if (hasLetters && hasNumbers && hasSpecialChars) {
      return "strong";
    }

    // Medium: letters and numbers
    if (hasLetters && hasNumbers) {
      return "medium";
    }

    // Weak: only one category or other combinations
    return "weak";
  },

  /**
   * Converts Password Value Object to string representation
   *
   * @param password - Valid Password Value Object
   * @returns The password as a plain string
   *
   * @example
   * ```ts
   * Password.toString(password); // "mySecurePass123"
   * ```
   */
  toString: (password: Password): string => {
    return password as string;
  },
};

/**
 * HashedPassword Value Object operations
 *
 * Provides factory function and verification method for hashed passwords.
 */
export const HashedPassword = {
  /**
   * Creates a HashedPassword Value Object from an existing hash
   *
   * Internal use - typically you create HashedPassword via Password.hash()
   *
   * @param value - The bcrypt hash string
   * @returns Result<HashedPassword>
   */
  create: (value: string): Result<HashedPassword> => {
    if (!value || value.length === 0) {
      return fail({
        code: "VALIDATION_ERROR",
        field: "password",
        message: "Hashed password cannot be empty",
      });
    }

    return success(value as HashedPassword);
  },

  /**
   * Converts HashedPassword Value Object to string representation
   *
   * @param hashedPassword - Valid HashedPassword Value Object
   * @returns The hash as a plain string
   *
   * @example
   * ```ts
   * HashedPassword.toString(hashed); // "$2b$10$..."
   * ```
   */
  toString: (hashedPassword: HashedPassword): string => {
    return hashedPassword as string;
  },

  /**
   * Verifies a plain-text password against a hashed password
   *
   * @param hashed - The HashedPassword to verify against
   * @param plain - The plain-text password to check
   * @returns Result<boolean> - Command that performs bcrypt comparison
   *
   * @example
   * ```ts
   * const verifyEffect = HashedPassword.verify(hashed, "myPassword123");
   * const result = await runEffect(verifyEffect);
   * if (result.status === "Success" && result.value === true) {
   *   // Password matches
   * }
   * ```
   */
  verify: (hashed: HashedPassword, plain: string): Result<boolean> => {
    return command(
      async () => {
        const isValid = await bcrypt.compare(plain, hashed as string);
        return isValid;
      },
      (isValid: boolean) => success(isValid),
      { operation: "verifyPassword", tags: { action: "validate", domain: "users" } },
    );
  },
};