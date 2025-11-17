# Infrastructure Layer Code Patterns

This document defines code quality patterns for the Infrastructure layer (Imperative Shell - Technical Concerns) including repositories, external services, and database schemas.

## Pattern Categories

Patterns are categorized by severity:
- **CRITICAL** (Blocking): Breaking issues, type safety violations - Must be fixed
- **IMPORTANT** (Warning): Best practices, maintainability - Warn, allow with acknowledgment
- **STYLE** (Info): Preferences, organization - Info only

---

## Repository Patterns

### IMPORTANT: Use Drizzle Schema Types

**Pattern ID**: INFR001

**Issue**: Inline types in repository methods duplicate schema definitions and become outdated when schema changes.

**Anti-Pattern**:
```typescript
// ❌ INLINE TYPE (hard to maintain)
export function createUserRepository(dbInstance: typeof db) {
  return {
    findById: (id: string): Promise<{
      id: string;
      email: string;
      name: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null> => {
      return dbInstance.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id),
      });
    },

    create: (data: {
      email: string;
      password: string;
      name?: string;
    }): Promise<{
      id: string;
      email: string;
      name: string | null;
    }[]> => {
      // ...
    }
  };
}
```

**Correct Pattern**:
```typescript
// ✅ DRIZZLE SCHEMA TYPES (single source of truth)
import type { User, NewUser } from "#db/schema";

export function createUserRepository(dbInstance: typeof db) {
  return {
    findById: (id: string): Promise<User | null> => {
      return dbInstance.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id),
      });
    },

    create: (data: NewUser): Promise<User[]> => {
      return dbInstance.insert(users).values(data).returning();
    }
  };
}
```

**Why This Matters**:
1. **Single Source of Truth**: Schema is the source, types inferred from it
2. **Automatic Updates**: Schema changes automatically update repository types
3. **Type Safety**: Can't mismatch schema and repository types
4. **Maintainability**: Change schema once, all repos update

**Detection**: `Promise<{ [a-z]` in `src/infrastructure/repositories/`
**Fix**: Report with suggestion (requires import and type change)
**Severity**: IMPORTANT

**Fix Suggestion Format**:
```
Repository method uses inline type.

File: src/infrastructure/repositories/drizzle/UserRepository.ts:12
Current: Promise<{ id: string; email: string } | null>
Suggested: Promise<User | null>

Add import: import type { User } from "#db/schema";
```

---

### CRITICAL: Repository Factory Pattern

**Pattern**: All repositories must use factory pattern with withTransaction support

```typescript
// ✅ CORRECT
export function createUserRepository(dbInstance: typeof db) {
  return {
    findById: (id: string): Promise<User | null> => { /* ... */ },
    create: (data: NewUser): Promise<User[]> => { /* ... */ },

    // REQUIRED: withTransaction method
    withTransaction: (tx: unknown) => createUserRepository(tx as typeof db),
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
export const userRepository = createUserRepository(db);
```

**Detection**: Repositories without `withTransaction` method
**Fix**: Report (must be added)
**Severity**: CRITICAL

---

### IMPORTANT: Consistent Method Naming

**Pattern**: Repository methods follow standard CRUD naming

**Standard Names**:
- `findById(id: string): Promise<T | null>` - Find single record by ID
- `findAll(): Promise<T[]>` - Find all records
- `findByX(x: string): Promise<T | null>` - Find by unique field (email, username)
- `findManyByX(x: string): Promise<T[]>` - Find multiple by non-unique field
- `create(data: NewT): Promise<T[]>` - Create (returns array from Drizzle)
- `update(id: string, data: Partial<NewT>): Promise<T[]>` - Update
- `delete(id: string): Promise<T[]>` - Delete

**Detection**: Method names not matching pattern
**Fix**: Report if inconsistent with existing repos
**Severity**: IMPORTANT

---

## External Service Patterns

### IMPORTANT: Service Interface Contracts

**Pattern**: External services should have interface contracts

```typescript
// ✅ CORRECT (interface contract)
export interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendPasswordReset(email: string, token: string): Promise<void>;
}

export class SendGridEmailService implements IEmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // Implementation
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    // Implementation
  }
}
```

**Detection**: Service classes without interfaces
**Fix**: Report
**Severity**: IMPORTANT

---

### IMPORTANT: Timeout Configuration

**Pattern**: External service calls should have timeout configuration

```typescript
// ✅ CORRECT (with timeout)
const response = await fetch(apiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
  signal: AbortSignal.timeout(5000) // 5 second timeout
});

// ❌ MISSING (no timeout)
const response = await fetch(apiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
});
```

**Detection**: fetch calls without timeout
**Fix**: Report with suggestion (add timeout)
**Severity**: IMPORTANT

---

## Database Schema Patterns

### STYLE: Consistent Column Naming

**Pattern**: Use snake_case for database columns, camelCase for TypeScript

```typescript
// ✅ CORRECT
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(), // DB: created_at, TS: createdAt
  updatedAt: timestamp("updated_at").defaultNow().notNull()
    .$onUpdate(() => new Date()),
});
```

**Detection**: Manual review
**Severity**: STYLE

---

### IMPORTANT: Default Values and Constraints

**Pattern**: Timestamps should have defaults, foreign keys should have cascade behavior

```typescript
// ✅ CORRECT (complete schema)
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // Cascade behavior defined
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(), // Default defined
});
```

**Detection**: Timestamps without defaults, foreign keys without cascade
**Fix**: Report
**Severity**: IMPORTANT

---

## Summary

**Critical Patterns** (Blocking):
- Repository factory pattern with withTransaction

**Important Patterns** (Warning):
- INFR001: Use Drizzle schema types (not inline types)
- Service interface contracts
- Timeout configuration for external calls
- Default values and cascade behavior in schemas

**Style Patterns** (Info):
- Consistent column naming (snake_case → camelCase)
- Method naming consistency

These patterns ensure Infrastructure layer code is:
- ✅ Type-safe (schema types, not inline types)
- ✅ Testable (factory pattern, dependency injection)
- ✅ Resilient (timeouts, proper cascade behavior)
- ✅ Maintainable (single source of truth for types)
