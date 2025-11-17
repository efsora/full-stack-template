# Core Layer Code Patterns

This document defines code quality patterns for the Core layer (Functional Core - Pure Business Logic) including workflows, operations, value objects, and type definitions.

## Pattern Categories

Patterns are categorized by severity:
- **CRITICAL** (Blocking): Type safety violations, incorrect Result usage - Must be fixed
- **IMPORTANT** (Warning): Best practices, maintainability - Warn, allow with acknowledgment
- **STYLE** (Info): Preferences, organization - Info only

---

## Workflow Patterns

### CRITICAL: Railway-Oriented Programming

**Pattern**: Workflows must use `pipe()` for composition

```typescript
// ✅ CORRECT (railway-oriented)
export function createUser(input: CreateUserInput): Result<CreateUserResult> {
  return pipe(
    validateUserCreation(input),
    checkEmailAvailability,
    hashPasswordForCreation,
    saveNewUser,
    addAuthToken
  );
}

// ❌ INCORRECT (manual composition)
export function createUser(input: CreateUserInput): Result<CreateUserResult> {
  const validated = validateUserCreation(input);
  if (validated.status === "Failure") return validated;
  const checked = checkEmailAvailability(validated.value);
  // ... manual error checking
}
```

**Detection**: Workflows not using `pipe()`
**Fix**: Report (structural refactoring needed)
**Severity**: CRITICAL

---

### CRITICAL: Explicit Return Types

**Pattern**: All workflow functions must have explicit Result return types

```typescript
// ✅ CORRECT (explicit return type)
export function createUser(input: CreateUserInput): Result<CreateUserResult> {
  return pipe(/* ... */);
}

// ❌ INCORRECT (missing return type)
export function createUser(input: CreateUserInput) {
  return pipe(/* ... */);
}
```

**Detection**: Workflows without `: Result<` return type
**Fix**: Report with inferred type
**Severity**: CRITICAL

---

## Operation Patterns

### CRITICAL: Side Effects Use command()

**Pattern**: Operations with side effects (async, database, external calls) must use `command()`

```typescript
// ✅ CORRECT (side effect wrapped in command)
export function saveNewUser(input: HashedInput): Result<UserData> {
  return command(
    async () => {
      const users = await userRepository.create(input);
      return first(users);
    },
    (user) =>
      user
        ? success({ id: user.id, email: user.email })
        : fail({ code: "INTERNAL_ERROR", message: "Failed to create user" }),
    {
      operation: "saveNewUser",
      tags: { domain: "users", action: "create" },
    }
  );
}

// ❌ INCORRECT (async without command)
export async function saveNewUser(input: HashedInput): Promise<UserData> {
  const users = await userRepository.create(input);
  return first(users);
}
```

**Why This Matters**:
- Automatic observability (tracing, metrics, logging)
- Consistent error handling
- Operation metadata for debugging

**Detection**: Async operations not using `command()`
**Fix**: Report (structural refactoring)
**Severity**: CRITICAL

---

### IMPORTANT: Pure Operations Don't Use command()

**Pattern**: Pure operations (validation, transformation) should NOT use `command()`

```typescript
// ✅ CORRECT (pure validation, no command)
export function validateUserCreation(
  input: CreateUserInput
): Result<ValidatedInput> {
  return allNamed({
    email: Email.create(input.email),
    password: Password.create(input.password),
  });
}

// ❌ INCORRECT (pure but uses command)
export function validateUserCreation(
  input: CreateUserInput
): Result<ValidatedInput> {
  return command(
    async () => ({ email: input.email, password: input.password }),
    // No async needed, shouldn't use command
  );
}
```

**Detection**: command() used but no async operations inside
**Fix**: Report
**Severity**: IMPORTANT

---

## Value Object Patterns

### CRITICAL: Branded Type Pattern

**Pattern**: Value objects must use branded types for type safety

```typescript
// ✅ CORRECT (branded type)
const brand: unique symbol = Symbol("Email");
export type Email = string & { readonly [brand]: typeof brand };

export const Email = {
  create: (value: string): Result<Email> => {
    // Validation
    return success(value as Email); // Type cast necessary for branded type
  },
  unwrap: (vo: Email): string => vo as string,
};

// ❌ INCORRECT (plain type alias)
export type Email = string;

export const Email = {
  create: (value: string): Result<Email> => {
    return success(value); // No type safety benefit
  },
};
```

**Detection**: Value objects without `unique symbol` brand
**Fix**: Report (needs branded type implementation)
**Severity**: CRITICAL

---

### IMPORTANT: Validation Completeness

**Pattern**: Value objects should validate all business rules

```typescript
// ✅ CORRECT (complete validation)
export const Email = {
  create: (value: string): Result<Email> => {
    if (!value) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Email is required",
        field: "email",
      });
    }

    if (value.length > 255) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Email must be 255 characters or less",
        field: "email",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Invalid email format",
        field: "email",
      });
    }

    return success(value as Email);
  },
};

// ❌ INCOMPLETE (missing validations)
export const Email = {
  create: (value: string): Result<Email> => {
    if (value.includes("@")) {
      return success(value as Email);
    }
    return fail({ code: "VALIDATION_ERROR", message: "Invalid email" });
  },
};
```

**Detection**: Manual review (complex to automate)
**Fix**: Report if validations seem incomplete
**Severity**: IMPORTANT

---

## External Service Patterns

### IMPORTANT: Error Handling with Retry Logic

**Pattern**: External service calls should have error handling and retry logic

```typescript
// ✅ CORRECT (with error handling and retry)
export function sendEmailWithRetry(
  to: string,
  subject: string,
  body: string
): Result<void> {
  return command(
    async () => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await emailClient.send({ to, subject, body });
          return { success: true };
        } catch (error) {
          lastError = error as Error;
          if (attempt < 2) {
            await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          }
        }
      }

      throw lastError;
    },
    (result) =>
      result.success
        ? success(undefined)
        : fail({ code: "EMAIL_SEND_FAILED", message: "Failed to send email after 3 attempts" }),
    {
      operation: "sendEmailWithRetry",
      tags: { service: "email", action: "send" },
    }
  );
}

// ❌ MISSING (no retry logic)
export function sendEmail(to: string, subject: string, body: string): Result<void> {
  return command(
    async () => {
      await emailClient.send({ to, subject, body });
      return { success: true };
    },
    // No retry, fails on first error
  );
}
```

**Detection**: External service calls without retry logic
**Fix**: Report
**Severity**: IMPORTANT

---

### IMPORTANT: Configuration Injection

**Pattern**: Services should receive configuration via dependency injection

```typescript
// ✅ CORRECT (config injected)
export function createEmailService(config: {
  apiKey: string;
  timeout: number;
  retries: number;
}) {
  return {
    sendEmail: async (to: string, subject: string, body: string) => {
      // Uses config.apiKey, config.timeout
    }
  };
}

export const emailService = createEmailService({
  apiKey: env.SENDGRID_API_KEY,
  timeout: 5000,
  retries: 3,
});

// ❌ INCORRECT (hardcoded config)
export const emailService = {
  sendEmail: async (to: string, subject: string, body: string) => {
    const apiKey = "hardcoded-key"; // Bad!
    // ...
  }
};
```

**Detection**: Hardcoded configuration values
**Fix**: Report
**Severity**: IMPORTANT

---

## Database Schema Patterns

### IMPORTANT: Index Strategy

**Pattern**: Add indexes for frequently queried columns

```typescript
// ✅ CORRECT (with indexes)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(), // Unique constraint = index
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("email_idx").on(table.email), // Explicit index
  createdAtIdx: index("created_at_idx").on(table.createdAt), // For sorting
}));

// ⚠️ MISSING (no indexes on queried columns)
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Missing: index on userId for joins, status for filtering
});
```

**Detection**: Tables without indexes on foreign keys or frequently queried columns
**Fix**: Report with suggestions
**Severity**: IMPORTANT

---

### CRITICAL: Foreign Key Cascade Behavior

**Pattern**: All foreign keys must specify cascade behavior

```typescript
// ✅ CORRECT (cascade defined)
userId: uuid("user_id")
  .notNull()
  .references(() => users.id, { onDelete: "cascade" }), // Explicit

// ❌ MISSING (cascade not specified)
userId: uuid("user_id")
  .notNull()
  .references(() => users.id), // What happens on delete?
```

**Detection**: Foreign keys without `onDelete` parameter
**Fix**: Report (requires design decision: cascade, setNull, restrict)
**Severity**: CRITICAL (affects data integrity)

---

## Type Definition Patterns

### IMPORTANT: Type File Organization

**Pattern**: Types organized in separate files by purpose

**Structure**:
```
types/
├── inputs.ts    # Request/input types (CreateUserInput, UpdateUserInput)
├── outputs.ts   # Response/output types (CreateUserResult, UserData)
├── errors.ts    # Domain-specific errors (UserNotFoundError, etc.)
└── internal.ts  # Implementation-only types (not exported from barrel)
```

**Detection**: Types not organized in correct files
**Fix**: Report if organization doesn't match existing domains
**Severity**: IMPORTANT

---

### STYLE: Consistent Type Naming

**Pattern**: Follow naming conventions from existing domains

**Input Types**: End with `Input`
```typescript
export type CreateUserInput = { ... };
export type UpdateUserInput = { ... };
export type QueryUsersInput = { ... };
```

**Output Types**: End with `Result` or `Data`
```typescript
export type CreateUserResult = { ... };
export type UserData = { ... };
export type ListUsersResult = { ... };
```

**Error Types**: End with `Error`
```typescript
export type UserNotFoundError = { ... };
export type UserEmailAlreadyExistsError = { ... };
```

**Detection**: Type names not matching patterns
**Fix**: Report if inconsistent with existing domains
**Severity**: STYLE

---

## Summary

**Critical Patterns** (Blocking):
- Workflows use pipe() composition
- Operations with side effects use command()
- Value objects use branded types
- Foreign keys have cascade behavior
- Repository factory pattern

**Important Patterns** (Warning):
- INFR001: Use Drizzle schema types (not inline)
- Pure operations don't use command()
- Value object validation completeness
- Service interface contracts
- Configuration injection
- Index strategy for queries
- Type file organization

**Style Patterns** (Info):
- Consistent type naming conventions
- Method naming consistency
- Code organization

These patterns ensure Core layer code is:
- ✅ Pure (functional core with no hidden side effects)
- ✅ Type-safe (branded types, explicit types)
- ✅ Observable (command() provides tracing/metrics)
- ✅ Testable (pure functions, dependency injection)
- ✅ Maintainable (consistent patterns)
