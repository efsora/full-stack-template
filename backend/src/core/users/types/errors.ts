/**
 * User Domain Error Types
 *
 * Defines all error types specific to the users domain.
 * Each error has a domain-specific code that encodes both the domain and error type.
 */

import type { ErrorBase } from "#lib/result/types/errors";

/**
 * Union of all user domain errors.
 * Use this type when handling user-specific errors.
 */
export type UserError =
  | UserEmailAlreadyExistsError
  | UserForbiddenError
  | UserInvalidEmailError
  | UserInvalidPasswordError
  | UserNotFoundError;

/**
 * User not found error - requested user doesn't exist.
 * Used when querying for a user that doesn't exist in the database.
 *
 * @example
 * ```typescript
 * fail({
 *   code: "USER_NOT_FOUND",
 *   message: "User not found"
 * })
 * ```
 */
export type UserNotFoundError = ErrorBase & {
  code: "USER_NOT_FOUND";
};

/**
 * User forbidden error - cannot access/modify another user's data.
 * Used when attempting to update or delete another user's profile.
 *
 * @example
 * ```typescript
 * fail({
 *   code: "USER_FORBIDDEN",
 *   message: "You do not have permission to access this user's data"
 * })
 * ```
 */
export type UserForbiddenError = ErrorBase & {
  code: "USER_FORBIDDEN";
};

/**
 * User email already exists error - email is already registered.
 * Used when attempting to register with an email that's already in use.
 *
 * @example
 * ```typescript
 * fail({
 *   code: "USER_EMAIL_ALREADY_EXISTS",
 *   message: "Email already in use"
 * })
 * ```
 */
export type UserEmailAlreadyExistsError = ErrorBase & {
  code: "USER_EMAIL_ALREADY_EXISTS";
};

/**
 * User invalid email error - email format is invalid.
 * Used when email validation fails.
 *
 * @example
 * ```typescript
 * fail({
 *   code: "USER_INVALID_EMAIL",
 *   message: "Invalid email format"
 * })
 * ```
 */
export type UserInvalidEmailError = ErrorBase & {
  code: "USER_INVALID_EMAIL";
};

/**
 * User invalid password error - password doesn't meet requirements.
 * Used when password validation fails.
 *
 * @example
 * ```typescript
 * fail({
 *   code: "USER_INVALID_PASSWORD",
 *   message: "Password must be at least 8 characters long"
 * })
 * ```
 */
export type UserInvalidPasswordError = ErrorBase & {
  code: "USER_INVALID_PASSWORD";
};
