/**
 * User Domain Error Types
 *
 * Defines all error types specific to the users domain.
 * These errors extend the base error types with user-specific context.
 */

import type {
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
  } from "#lib/effect/types/errors.js";
  
  /**
   * Email conflict error - email already taken.
   * Used when attempting to register with an email that already exists.
   */
  export type UserEmailConflictError = ConflictError & {
    conflictType: "email";
    email: string;
  };
  
  /**
   * Union of all user domain errors.
   * Use this type when handling user-specific errors.
   */
  export type UserError =
    | UserEmailConflictError
    | UserForbiddenError
    | UserInvalidCredentialsError
    | UserNotFoundError
    | UserValidationError;
  
  /**
   * User forbidden error - cannot access/modify another user's data.
   * Used when attempting to update or delete another user's profile.
   */
  export type UserForbiddenError = ForbiddenError & {
    resourceType: "user";
  };
  
  /**
   * Invalid credentials error - login failed.
   * Used when email or password is incorrect during authentication.
   */
  export type UserInvalidCredentialsError = UnauthorizedError;
  
  /**
   * User not found error - requested user doesn't exist.
   * Used when querying for a user that doesn't exist in the database.
   */
  export type UserNotFoundError = NotFoundError & {
    resourceType: "user";
  };
  
  /**
   * User validation error - invalid user input.
   * Used when user registration or update data fails validation.
   */
  export type UserValidationError = ValidationError;