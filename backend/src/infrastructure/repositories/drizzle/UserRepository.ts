import type { NewUser, User } from "#db/schema";

import { db } from "#db/client";
import { users } from "#db/schema";
import { eq } from "drizzle-orm";

export type UserRepository = ReturnType<typeof createUserRepository>;

/**
 * Creates a Drizzle ORM implementation of User Repository
 *
 * @function createUserRepository
 * @param {typeof db} dbInstance - The Drizzle database instance
 * @returns User repository implementation
 */
export function createUserRepository(dbInstance: typeof db) {
  return {
    create: (data: NewUser) => {
      return dbInstance.insert(users).values(data).returning();
    },

    delete: (id: string) => {
      return dbInstance.delete(users).where(eq(users.id, id)).returning();
    },

    findAll: () => {
      return dbInstance.select().from(users);
    },

    findByEmail: (email: string): Promise<User[]> => {
      return dbInstance
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    },

    findById: (id: string): Promise<User[]> => {
      return dbInstance.select().from(users).where(eq(users.id, id)).limit(1);
    },

    update: (id: string, data: Partial<Omit<NewUser, "id">>) => {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      return dbInstance
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
    },

    withTransaction: (tx: unknown) => createUserRepository(tx as typeof db),
  };
}
