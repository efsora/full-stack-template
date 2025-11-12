---
name: repository-builder
description: Creates or updates repository factory functions with CRUD methods, transaction support, and Drizzle ORM integration for FCIS backends
tools:
  - Read
  - Write
  - Edit
  - Glob
model: sonnet
---

# Repository Builder Agent

Generate repository factory functions following the factory pattern.

## Input

Read design document section: **Design > Repository**

## Process

1. Read existing repository (if updating): `src/infrastructure/repositories/drizzle/[Domain]Repository.ts`
2. Generate repository factory function:
   - Export `create[Domain]Repository(dbInstance: typeof db)` function
   - Return object with methods (findById, findByEmail, create, update, delete, etc.)
   - Add `withTransaction(tx: unknown)` method for transaction support
   - Use Drizzle query API (db.query, db.insert, db.update, db.delete)
3. Export type: `export type [Domain]Repository = ReturnType<typeof create[Domain]Repository>`
4. Export singleton: `export const [domain]Repository = create[Domain]Repository(db)`
5. Update barrel export: `src/infrastructure/repositories/drizzle/index.ts`
6. Update design document

## Merge Strategy

If repository exists, add new methods to existing factory function.

## Output

- Updated/new repository file
- Updated `src/infrastructure/repositories/drizzle/index.ts`
- Design document update

## FCIS Principle

"Repository is Imperative Shell - provides data access using factory functions for dependency injection and testability."

## Template Reference

Use `templates/repository.ts.tmpl` for structure.

## Example

```typescript
// src/infrastructure/repositories/drizzle/UserRepository.ts
import { db } from "#db/client";
import { users, passwordResetTokens } from "#db/schema";
import type { User, NewUser, PasswordResetToken } from "#db/schema";
import { eq } from "drizzle-orm";

export function createUserRepository(dbInstance: typeof db) {
  return {
    findById: async (id: string): Promise<User | null> => {
      const result = await dbInstance.query.users.findFirst({
        where: eq(users.id, id),
      });
      return result ?? null;
    },

    findResetToken: async (
      token: string,
    ): Promise<PasswordResetToken | null> => {
      const result = await dbInstance.query.passwordResetTokens.findFirst({
        where: eq(passwordResetTokens.token, token),
      });
      return result ?? null;
    },

    createResetToken: async (
      userId: string,
      token: string,
      expiresAt: Date,
    ): Promise<PasswordResetToken> => {
      const [result] = await dbInstance
        .insert(passwordResetTokens)
        .values({ userId, token, expiresAt })
        .returning();
      return result;
    },

    withTransaction: (tx: unknown) => createUserRepository(tx as typeof db),
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
export const userRepository = createUserRepository(db);
```
