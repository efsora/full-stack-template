# Naming Conventions

This document outlines the naming conventions used in FCIS architecture for consistency across the codebase.

## Files

### Workflows

- **Format**: `[feature].workflow.ts`
- **Case**: kebab-case
- **Examples**:
  - `create-user.workflow.ts`
  - `password-reset.workflow.ts`
  - `list-users.workflow.ts`

### Operations

- **Format**: `[feature].operations.ts`
- **Case**: kebab-case
- **Examples**:
  - `create-user.operations.ts`
  - `password-reset.operations.ts`
  - `user-validation.operations.ts`

### Value Objects

- **Format**: `[Name].ts`
- **Case**: PascalCase
- **Examples**:
  - `Email.ts`
  - `Password.ts`
  - `ResetToken.ts`
  - `PhoneNumber.ts`

### Type Files

- **Format**: Fixed names
- **Files**:
  - `inputs.ts` - Input types for workflows
  - `outputs.ts` - Output types for workflows
  - `errors.ts` - Domain-specific error types
  - `internal.ts` - Internal implementation types

### Repository Files

- **Format**: `[Domain]Repository.ts`
- **Case**: PascalCase for domain
- **Examples**:
  - `UserRepository.ts`
  - `ProductRepository.ts`
  - `OrderRepository.ts`

### Service Files

- **Format**: `[Service]Service.ts`
- **Case**: PascalCase for service
- **Examples**:
  - `EmailService.ts`
  - `PaymentService.ts`
  - `SMSService.ts`

## Functions

### Workflows

- **Format**: `verbNoun` (imperative, action-oriented)
- **Case**: camelCase
- **Examples**:
  - `createUser`
  - `requestPasswordReset`
  - `resetPassword`
  - `listUsers`
  - `updateUserProfile`
  - `deleteUser`

### Operations

- **Format**: `verbNoun` or `verbAdjectiveNoun`
- **Case**: camelCase
- **Examples**:
  - `validateEmail`
  - `hashPassword`
  - `checkEmailAvailability`
  - `generateResetToken`
  - `sendResetEmail`
  - `saveNewUser`

### Value Object Methods

- **Format**: Fixed method names
- **Methods**:
  - `create` - Create value object with validation
  - `unwrap` - Extract raw value
  - `equals` - Compare two value objects
  - `format` - Format value for display
  - `isValid` - Check if value is valid (static)

### Repository Methods

- **Format**: Standard CRUD + domain-specific
- **Case**: camelCase
- **Standard**:
  - `findById(id: string)`
  - `findByEmail(email: string)`
  - `findMany(criteria: Criteria)`
  - `create(data: NewEntity)`
  - `update(id: string, data: Partial<Entity>)`
  - `delete(id: string)`
  - `withTransaction(tx: unknown)`
- **Domain-specific examples**:
  - `findResetToken(token: string)`
  - `findActiveUsers()`
  - `findByDateRange(start: Date, end: Date)`

## Types

### Input Types

- **Format**: `[Action]Input`
- **Case**: PascalCase
- **Examples**:
  - `CreateUserInput`
  - `RequestResetInput`
  - `ResetPasswordInput`
  - `UpdateProfileInput`
  - `ListUsersInput`

### Output Types

- **Format**: `[Action]Result` or `[Entity]Data`
- **Case**: PascalCase
- **Examples**:
  - `CreateUserResult`
  - `ResetResult`
  - `UserData`
  - `ListUsersResult`
  - `ProfileData`

### Error Types

- **Format**: `DOMAIN_ERROR_DESCRIPTION` or `CATEGORY_ERROR_DESCRIPTION`
- **Case**: SCREAMING_SNAKE_CASE
- **Examples**:
  - `USER_NOT_FOUND`
  - `USER_EMAIL_ALREADY_EXISTS`
  - `USER_INACTIVE`
  - `RESET_TOKEN_INVALID`
  - `RESET_TOKEN_EXPIRED`
  - `VALIDATION_ERROR`
  - `INTERNAL_ERROR`
  - `UNAUTHORIZED`
  - `FORBIDDEN`

### Value Object Types

- **Format**: `[Name]` (matches file name)
- **Case**: PascalCase
- **Examples**:
  - `Email`
  - `Password`
  - `ResetToken`
  - `PhoneNumber`
  - `UUID`

### Internal Types

- **Format**: `[Purpose]Data` or `[Adjective][Entity]Data`
- **Case**: PascalCase
- **Examples**:
  - `HashedPasswordData`
  - `ValidatedEmailData`
  - `TokenData`
  - `UserWithTokenData`

### Repository/Service Types

- **Format**: `I[Service]Service` for interfaces, `[Domain]Repository` for types
- **Case**: PascalCase
- **Examples**:
  - `IEmailService` (interface)
  - `IPaymentService` (interface)
  - `UserRepository` (type)
  - `ProductRepository` (type)

## Constants

### Environment Variables

- **Format**: SCREAMING_SNAKE_CASE
- **Examples**:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `NODE_ENV`
  - `PORT`
  - `EMAIL_API_KEY`

### Configuration Values

- **Format**: camelCase
- **Examples**:
  - `jwtSecret`
  - `databaseUrl`
  - `nodeEnv`
  - `port`

### True Constants

- **Format**: SCREAMING_SNAKE_CASE
- **Examples**:
  - `MAX_LOGIN_ATTEMPTS`
  - `TOKEN_EXPIRY_HOURS`
  - `DEFAULT_PAGE_SIZE`
  - `PASSWORD_MIN_LENGTH`

## Routes

### Route Paths

- **Format**: kebab-case
- **Examples**:
  - `/users`
  - `/auth/login`
  - `/auth/reset-request`
  - `/auth/reset`
  - `/users/:id`
  - `/users/:id/profile`

### Route Handlers

- **Format**: `handle[Action]`
- **Case**: camelCase with "handle" prefix
- **Examples**:
  - `handleCreate`
  - `handleGetById`
  - `handleUpdate`
  - `handleDelete`
  - `handleList`
  - `handleResetRequest`
  - `handleReset`

### Zod Schemas

- **Format**: `[purpose]Schema`
- **Case**: camelCase with "Schema" suffix
- **Examples**:
  - `createBodySchema`
  - `updateBodySchema`
  - `idParamsSchema`
  - `listQuerySchema`
  - `resetRequestSchema`

## Best Practices

1. **Be Consistent**: Use the same naming pattern throughout the codebase
2. **Be Descriptive**: Names should clearly indicate purpose
3. **Be Concise**: Avoid unnecessarily long names
4. **Use Domain Language**: Prefer domain terms over technical jargon
5. **Avoid Abbreviations**: Spell out words unless widely understood (e.g., "id" is okay)
6. **Follow TypeScript Conventions**: PascalCase for types/interfaces, camelCase for functions/variables
7. **Use Verb-First for Actions**: Functions that perform actions should start with verbs
8. **Use Noun-First for Data**: Types and data structures should start with nouns
