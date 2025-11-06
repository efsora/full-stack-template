# Value Object Patterns

This document outlines common value object patterns in FCIS architecture using branded types for type safety.

## What are Value Objects?

Value objects are immutable, self-validating domain primitives that prevent "primitive obsession" by encapsulating validation rules and domain logic.

**Benefits**:
- Type safety (can't mix up email with password)
- Self-validation (invalid values can't exist)
- Encapsulation of domain rules
- Improved code readability
- Easier testing

## Base Pattern

```typescript
import { success, fail, type Result } from "#lib/result";
import type { AppError } from "#lib/types/errors";

const brand: unique symbol = Symbol("[Name]");

export type [Name] = string & { readonly [brand]: typeof brand };

export const [Name] = {
  create: (value: string): Result<[Name]> => {
    // Validation logic
    if (!isValid(value)) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Invalid [name]",
        field: "[fieldName]",
      } as AppError);
    }
    return success(value as [Name]);
  },

  unwrap: (vo: [Name]): string => vo as string,
};
```

## Common Value Objects

### Email

**Purpose**: Ensure valid email format

```typescript
import { success, fail, type Result } from "#lib/result";
import type { AppError } from "#lib/types/errors";

const brand: unique symbol = Symbol("Email");

export type Email = string & { readonly [brand]: typeof brand };

export const Email = {
  create: (value: string): Result<Email> => {
    if (!value || value.length === 0) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Email cannot be empty",
        field: "email",
      } as AppError);
    }

    if (value.length > 255) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Email must be 255 characters or less",
        field: "email",
      } as AppError);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Invalid email format",
        field: "email",
      } as AppError);
    }

    return success(value.toLowerCase() as Email);
  },

  unwrap: (email: Email): string => email as string,

  equals: (a: Email, b: Email): boolean => {
    return Email.unwrap(a) === Email.unwrap(b);
  },

  domain: (email: Email): string => {
    const unwrapped = Email.unwrap(email);
    return unwrapped.split("@")[1];
  },
};
```

### Password

**Purpose**: Ensure password strength

```typescript
import { success, fail, type Result } from "#lib/result";
import type { AppError } from "#lib/types/errors";

const brand: unique symbol = Symbol("Password");

export type Password = string & { readonly [brand]: typeof brand };

export const Password = {
  create: (value: string): Result<Password> => {
    if (!value || value.length === 0) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Password cannot be empty",
        field: "password",
      } as AppError);
    }

    if (value.length < 8) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Password must be at least 8 characters",
        field: "password",
      } as AppError);
    }

    if (value.length > 128) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Password must be 128 characters or less",
        field: "password",
      } as AppError);
    }

    // Check for at least one number
    if (!/\d/.test(value)) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Password must contain at least one number",
        field: "password",
      } as AppError);
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(value)) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Password must contain at least one letter",
        field: "password",
      } as AppError);
    }

    return success(value as Password);
  },

  unwrap: (password: Password): string => password as string,

  strength: (password: Password): "weak" | "medium" | "strong" => {
    const unwrapped = Password.unwrap(password);
    let strength = 0;

    if (unwrapped.length >= 12) strength++;
    if (/[a-z]/.test(unwrapped)) strength++;
    if (/[A-Z]/.test(unwrapped)) strength++;
    if (/\d/.test(unwrapped)) strength++;
    if (/[^a-zA-Z\d]/.test(unwrapped)) strength++;

    if (strength >= 4) return "strong";
    if (strength >= 3) return "medium";
    return "weak";
  },
};
```

### UUID

**Purpose**: Ensure valid UUID format

```typescript
import { success, fail, type Result } from "#lib/result";
import type { AppError } from "#lib/types/errors";
import { randomUUID } from "crypto";

const brand: unique symbol = Symbol("UUID");

export type UUID = string & { readonly [brand]: typeof brand };

export const UUID = {
  create: (value: string): Result<UUID> => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Invalid UUID format",
        field: "id",
      } as AppError);
    }

    return success(value.toLowerCase() as UUID);
  },

  unwrap: (uuid: UUID): string => uuid as string,

  generate: (): UUID => randomUUID() as UUID,

  equals: (a: UUID, b: UUID): boolean => {
    return UUID.unwrap(a) === UUID.unwrap(b);
  },

  nil: (): UUID => "00000000-0000-0000-0000-000000000000" as UUID,

  isNil: (uuid: UUID): boolean => {
    return UUID.unwrap(uuid) === "00000000-0000-0000-0000-000000000000";
  },
};
```

### PhoneNumber

**Purpose**: Ensure valid phone number format

```typescript
import { success, fail, type Result } from "#lib/result";
import type { AppError } from "#lib/types/errors";

const brand: unique symbol = Symbol("PhoneNumber");

export type PhoneNumber = string & { readonly [brand]: typeof brand };

export const PhoneNumber = {
  create: (value: string): Result<PhoneNumber> => {
    // Remove common formatting characters
    const cleaned = value.replace(/[\s\-\(\)\.]/g, "");

    // Check if only digits and optional leading +
    if (!/^\+?\d+$/.test(cleaned)) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Phone number must contain only digits",
        field: "phoneNumber",
      } as AppError);
    }

    // Check length (international format: 7-15 digits)
    const digits = cleaned.replace(/^\+/, "");
    if (digits.length < 7 || digits.length > 15) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Phone number must be between 7 and 15 digits",
        field: "phoneNumber",
      } as AppError);
    }

    return success(cleaned as PhoneNumber);
  },

  unwrap: (phone: PhoneNumber): string => phone as string,

  format: (phone: PhoneNumber, style: "international" | "national"): string => {
    const unwrapped = PhoneNumber.unwrap(phone);

    if (style === "international") {
      // Format as +X (XXX) XXX-XXXX
      const digits = unwrapped.replace(/^\+/, "");
      if (digits.length === 10) {
        return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      return unwrapped;
    }

    // Format as (XXX) XXX-XXXX
    const digits = unwrapped.replace(/^\+\d/, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return unwrapped;
  },
};
```

### Slug

**Purpose**: URL-friendly identifier

```typescript
import { success, fail, type Result } from "#lib/result";
import type { AppError } from "#lib/types/errors";

const brand: unique symbol = Symbol("Slug");

export type Slug = string & { readonly [brand]: typeof brand };

export const Slug = {
  create: (value: string): Result<Slug> => {
    if (!value || value.length === 0) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Slug cannot be empty",
        field: "slug",
      } as AppError);
    }

    // Must contain only lowercase letters, numbers, and hyphens
    if (!/^[a-z0-9-]+$/.test(value)) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Slug must contain only lowercase letters, numbers, and hyphens",
        field: "slug",
      } as AppError);
    }

    // Cannot start or end with hyphen
    if (value.startsWith("-") || value.endsWith("-")) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Slug cannot start or end with hyphen",
        field: "slug",
      } as AppError);
    }

    // Cannot contain consecutive hyphens
    if (value.includes("--")) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Slug cannot contain consecutive hyphens",
        field: "slug",
      } as AppError);
    }

    return success(value as Slug);
  },

  unwrap: (slug: Slug): string => slug as string,

  fromString: (value: string): Result<Slug> => {
    const slugified = value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/--+/g, "-") // Remove consecutive hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    return Slug.create(slugified);
  },
};
```

### Age

**Purpose**: Ensure valid age range

```typescript
import { success, fail, type Result } from "#lib/result";
import type { AppError } from "#lib/types/errors";

const brand: unique symbol = Symbol("Age");

export type Age = number & { readonly [brand]: typeof brand };

export const Age = {
  create: (value: number): Result<Age> => {
    if (!Number.isInteger(value)) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Age must be a whole number",
        field: "age",
      } as AppError);
    }

    if (value < 0) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Age cannot be negative",
        field: "age",
      } as AppError);
    }

    if (value > 150) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Age must be 150 or less",
        field: "age",
      } as AppError);
    }

    return success(value as Age);
  },

  unwrap: (age: Age): number => age as number,

  fromBirthDate: (birthDate: Date): Result<Age> => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return Age.create(age);
  },

  isMinor: (age: Age): boolean => {
    return Age.unwrap(age) < 18;
  },

  isSenior: (age: Age): boolean => {
    return Age.unwrap(age) >= 65;
  },
};
```

### ResetToken

**Purpose**: Password reset token validation

```typescript
import { success, fail, type Result } from "#lib/result";
import type { AppError } from "#lib/types/errors";

const brand: unique symbol = Symbol("ResetToken");

export type ResetToken = string & { readonly [brand]: typeof brand };

export const ResetToken = {
  create: (value: string): Result<ResetToken> => {
    if (!value || value.length === 0) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Reset token cannot be empty",
        field: "token",
      } as AppError);
    }

    if (value.length < 32) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Reset token must be at least 32 characters",
        field: "token",
      } as AppError);
    }

    // Check if hexadecimal
    if (!/^[a-f0-9]+$/i.test(value)) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Reset token must be hexadecimal",
        field: "token",
      } as AppError);
    }

    return success(value as ResetToken);
  },

  unwrap: (token: ResetToken): string => token as string,

  equals: (a: ResetToken, b: ResetToken): boolean => {
    return ResetToken.unwrap(a) === ResetToken.unwrap(b);
  },

  generate: (): ResetToken => {
    const bytes = crypto.randomBytes(32);
    return bytes.toString("hex") as ResetToken;
  },
};
```

## Usage in Workflows

Value objects integrate seamlessly with the Result system:

```typescript
import { pipe, allNamed } from "#lib/result";
import { Email } from "./value-objects/Email";
import { Password } from "./value-objects/Password";

export function createUser(input: CreateUserInput): Result<CreateUserResult> {
  return pipe(
    // Validate all value objects in parallel
    allNamed({
      email: Email.create(input.email),
      password: Password.create(input.password),
    }),
    // Continue with validated value objects
    (validated) => checkEmailAvailability(Email.unwrap(validated.email)),
    (email) => hashPassword(Password.unwrap(validated.password)),
    (hashed) => saveUser({ email, password: hashed }),
  );
}
```

## Best Practices

1. **Single Responsibility**: One value object per domain concept
2. **Immutability**: Value objects should be immutable
3. **Self-Validation**: Validation logic lives in the value object
4. **Type Safety**: Use branded types to prevent mixing
5. **Equality**: Implement equals() for comparison
6. **Helper Methods**: Add domain-specific helpers
7. **Documentation**: Document validation rules
8. **Testing**: Test all validation paths
9. **Unwrap at Boundaries**: Unwrap at infrastructure boundaries (DB, API)
10. **Reusability**: Reuse value objects across domains

## When to Create a Value Object

Create a value object when:
- ✅ The value has validation rules
- ✅ The value has domain meaning beyond its primitive type
- ✅ Mixing it with other values would be an error
- ✅ It has behavior or derived properties
- ✅ It appears in multiple places

Don't create a value object when:
- ❌ It's just a simple primitive with no validation
- ❌ It's only used in one place
- ❌ The primitive type is sufficient
- ❌ Validation is trivial (e.g., non-empty string)
