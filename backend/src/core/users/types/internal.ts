import type { Email } from "#core/users/value-objects/Email.js";
import type { Password } from "#core/users/value-objects/Password.js";

/**
 * Internal types for Users domain
 *
 * These types are used only within the domain for intermediate processing.
 * They are not exposed outside the users module.
 */

/**
 * User data with password for update operations
 * Used internally for operations that need access to password hash
 */
export type UserDataWithPassword = {
  createdAt: Date;
  email: string;
  id: string;
  name: string | null;
  password: string;
  updatedAt: Date;
};

export type ValidatedCreationData = {
  email: Email;
  name?: string;
  password: Password;
};

export type ValidatedRegistrationData = {
  email: Email;
  name?: string;
  password: Password;
};
