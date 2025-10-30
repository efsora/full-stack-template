/**
 * User Domain Error Types
 *
 * Defines all error types specific to the users domain.
 * These errors extend the base error types with user-specific context.
 */

import type {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "#lib/result/types/errors";

/**
 * Union of all user domain errors.
 * Use this type when handling user-specific errors.
 */
export type UserError =
  | UserForbiddenError
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