# Error Handling Patterns

This document outlines error handling patterns in FCIS architecture using the Result type system.

## Error Code Structure

### Format
`[DOMAIN]_[DESCRIPTION]` or `[CATEGORY]_[DESCRIPTION]`

### Examples

**Domain-Specific Errors**:
- `USER_NOT_FOUND`
- `USER_EMAIL_ALREADY_EXISTS`
- `USER_INACTIVE`
- `USER_INVALID_PASSWORD`
- `PRODUCT_OUT_OF_STOCK`
- `ORDER_ALREADY_PROCESSED`
- `PAYMENT_DECLINED`

**Category Errors**:
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource doesn't exist
- `ALREADY_EXISTS` - Resource already exists (unique constraint)
- `FORBIDDEN` - Authorized but not allowed
- `UNAUTHORIZED` - Not authenticated
- `INTERNAL_ERROR` - Unexpected server error
- `EXTERNAL_SERVICE_ERROR` - External API/service failure

## Error Types

### AppError Structure

Use `AppError` from `#lib/types/errors`:

```typescript
type AppError = {
  code: string;
  message: string;
  field?: string;
  resourceType?: string;
  resourceId?: string;
  details?: unknown;
};
```

### Creating Errors with fail()

```typescript
import { fail } from "#lib/result";

// Validation error
return fail({
  code: "VALIDATION_ERROR",
  message: "Email format is invalid",
  field: "email",
});

// Not found error
return fail({
  code: "USER_NOT_FOUND",
  message: `User with ID ${userId} not found`,
  resourceType: "user",
  resourceId: userId,
});

// Already exists error
return fail({
  code: "USER_EMAIL_ALREADY_EXISTS",
  message: `User with email ${email} already exists`,
  field: "email",
});

// Forbidden error
return fail({
  code: "FORBIDDEN",
  message: `User ${userId} is not allowed to perform this action`,
  resourceType: "user",
  resourceId: userId,
});

// Unauthorized error
return fail({
  code: "UNAUTHORIZED",
  message: "Invalid or expired authentication token",
});

// Internal error
return fail({
  code: "INTERNAL_ERROR",
  message: "Failed to process request",
  details: error,
});

// External service error
return fail({
  code: "EXTERNAL_SERVICE_ERROR",
  message: "Failed to send email",
  details: { service: "email", error: error.message },
});
```

## Common Error Patterns

### 1. Not Found Pattern

**Use Case**: Resource doesn't exist

```typescript
export function findUserById(id: string): Result<User> {
  return command(
    async () => {
      const user = await userRepository.findById(id);
      return user;
    },
    (user) => {
      return user
        ? success(user)
        : fail({
            code: "USER_NOT_FOUND",
            message: `User with ID ${id} not found`,
            resourceType: "user",
            resourceId: id,
          });
    },
    { operation: "findUserById", tags: { domain: "users" } }
  );
}
```

### 2. Already Exists Pattern

**Use Case**: Unique constraint violation

```typescript
export function checkEmailAvailability(email: string): Result<string> {
  return command(
    async () => {
      const existing = await userRepository.findByEmail(email);
      return existing;
    },
    (existing) => {
      return existing
        ? fail({
            code: "USER_EMAIL_ALREADY_EXISTS",
            message: `User with email ${email} already exists`,
            field: "email",
          })
        : success(email);
    },
    { operation: "checkEmailAvailability", tags: { domain: "users" } }
  );
}
```

### 3. Validation Error Pattern

**Use Case**: Input validation failure

```typescript
export function validateEmail(email: string): Result<string> {
  if (!email || !email.includes("@")) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "Invalid email format",
      field: "email",
    });
  }

  if (email.length > 255) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "Email must be 255 characters or less",
      field: "email",
    });
  }

  return success(email);
}
```

### 4. Authorization Error Pattern

**Use Case**: User not authenticated

```typescript
export function checkAuthentication(token: string): Result<TokenData> {
  return command(
    async () => {
      const decoded = await verifyToken(token);
      return decoded;
    },
    (decoded) => {
      return decoded
        ? success(decoded)
        : fail({
            code: "UNAUTHORIZED",
            message: "Invalid or expired authentication token",
          });
    },
    { operation: "checkAuthentication", tags: { domain: "auth" } }
  );
}
```

### 5. Permission Error Pattern

**Use Case**: User authenticated but not allowed

```typescript
export function checkUserPermission(
  userId: string,
  resourceId: string
): Result<void> {
  return command(
    async () => {
      const hasPermission = await permissionRepository.check(userId, resourceId);
      return hasPermission;
    },
    (hasPermission) => {
      return hasPermission
        ? success(undefined)
        : fail({
            code: "FORBIDDEN",
            message: `User ${userId} is not allowed to access resource ${resourceId}`,
            resourceType: "resource",
            resourceId: resourceId,
          });
    },
    { operation: "checkUserPermission", tags: { domain: "auth" } }
  );
}
```

### 6. External Service Error Pattern

**Use Case**: External API/service failure

```typescript
export function sendEmail(to: string, subject: string): Result<void> {
  return command(
    async () => {
      await emailClient.send({ to, subject, body: "..." });
    },
    () => success(undefined),
    { operation: "sendEmail", tags: { domain: "email", action: "send" } }
  ).catch((error) => {
    return fail({
      code: "EXTERNAL_SERVICE_ERROR",
      message: "Failed to send email",
      details: { service: "email", to, error: error.message },
    });
  });
}
```

### 7. Business Rule Violation Pattern

**Use Case**: Business logic constraint violation

```typescript
export function validateUserAge(age: number): Result<number> {
  if (age < 18) {
    return fail({
      code: "USER_AGE_TOO_YOUNG",
      message: "User must be at least 18 years old",
      field: "age",
    });
  }

  if (age > 120) {
    return fail({
      code: "USER_AGE_INVALID",
      message: "Invalid age provided",
      field: "age",
    });
  }

  return success(age);
}
```

### 8. Resource State Error Pattern

**Use Case**: Resource in invalid state for operation

```typescript
export function activateUser(userId: string): Result<User> {
  return command(
    async () => {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      if (user.isActive) {
        throw new Error("User already active");
      }
      return await userRepository.update(userId, { isActive: true });
    },
    (user) => success(user),
    { operation: "activateUser", tags: { domain: "users", action: "activate" } }
  ).catch((error) => {
    if (error.message === "User not found") {
      return fail({
        code: "USER_NOT_FOUND",
        message: `User with ID ${userId} not found`,
        resourceType: "user",
        resourceId: userId,
      });
    }
    if (error.message === "User already active") {
      return fail({
        code: "USER_ALREADY_ACTIVE",
        message: `User ${userId} is already active`,
        resourceType: "user",
        resourceId: userId,
      });
    }
    return fail({
      code: "INTERNAL_ERROR",
      message: "Failed to activate user",
      details: error,
    });
  });
}
```

## Error Handling in Workflows

Workflows automatically propagate errors through the pipe:

```typescript
export function createUser(input: CreateUserInput): Result<CreateUserResult> {
  return pipe(
    validateEmail(input.email),          // If fails, stops here
    (email) => checkEmailAvailability(email), // Only runs if previous succeeds
    (email) => hashPassword(input.password),  // Only runs if previous succeeds
    (hashed) => saveUser({ email: input.email, password: hashed }), // Only runs if previous succeeds
  );
}
```

## HTTP Response Mapping

Errors are automatically mapped to HTTP status codes in handlers:

```typescript
// src/lib/types/response.ts
const errorCodeToStatus: Record<string, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  USER_EMAIL_ALREADY_EXISTS: 409,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INTERNAL_ERROR: 500,
  EXTERNAL_SERVICE_ERROR: 503,
};
```

## Best Practices

1. **Use Specific Error Codes**: Prefer domain-specific codes over generic ones
2. **Include Context**: Add resourceType, resourceId, field when applicable
3. **Clear Messages**: Write user-friendly error messages
4. **Avoid Sensitive Data**: Don't include passwords, tokens in error details
5. **Log Internal Errors**: Use logger for INTERNAL_ERROR details
6. **Consistent Patterns**: Use established patterns for common scenarios
7. **Railway-Oriented**: Let pipe() handle error propagation
8. **No Exceptions in Core**: Use Result type instead of throwing errors
9. **Document Error Codes**: Keep error codes documented in types/errors.ts
10. **Test Error Paths**: Write tests for both success and failure cases
