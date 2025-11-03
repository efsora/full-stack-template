/**
 * Users Module
 * Public API for user operations
 */

// Workflows
export { createUser } from "./create-user.workflow";
export { getUserById } from "./get-user.workflow";

// Public types - Inputs
export type { CreateUserInput, UpdateUserInput } from "./types/inputs";

// Public types - Outputs
export type {
  CreateUserResult,
  UpdateUserResult,
  UserData,
} from "./types/outputs";

// Public types - Errors
export type {
  UserEmailAlreadyExistsError,
  UserError,
  UserForbiddenError,
  UserInvalidEmailError,
  UserInvalidPasswordError,
  UserNotFoundError,
} from "./types/errors";

// Value objects
export { Email } from "./value-objects/Email";
export { Password } from "./value-objects/Password";

// Note: operations, internal types, and other implementation details are intentionally NOT exported
// Handlers should only use workflows from this barrel file
