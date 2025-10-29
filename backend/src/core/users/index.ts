/**
 * Users Module
 * Public API for user operations
 */

// Workflows
export { login } from "./login.workflow";
export { register } from "./register.workflow";
export { getUserById } from "./get-user.workflow";

// Public types - Inputs
export type { LoginInput, RegisterInput, UpdateUserInput } from "./types/inputs";

// Public types - Outputs
export type { LoginResult, RegisterResult, UserData } from "./types/outputs";

// Public types - Errors
export type {
  UserEmailConflictError,
  UserInvalidCredentialsError,
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
