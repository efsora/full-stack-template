/**
 * Users Module
 * Public API for user operations
 */

// Workflows
export { createUser } from "./create-user.workflow";
export { getUserById } from "./get-user.workflow";
export { login } from "./login.workflow";

// Public types - Inputs
export type { UpdateUserInput } from "./types/inputs";
export type { CreateUserInput } from "./types/create-user";
export type { LoginInput } from "./types/login";

// Public types - Outputs
export type { UserData } from "./types/outputs";
export type { CreateUserResult } from "./types/create-user";
export type { LoginResult } from "./types/login";

// Public types - Errors
export type {
  UserNotFoundError,
  UserForbiddenError,
  UserValidationError,
  UserError,
} from "./types/errors";

// Value objects
export { Email } from "./value-objects/Email";
export { Password } from "./value-objects/Password";

// Note: operations, internal types, and other implementation details are intentionally NOT exported
// Handlers should only use workflows from this barrel file
