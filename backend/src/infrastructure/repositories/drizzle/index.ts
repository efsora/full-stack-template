/**
 * Repository Module
 * Central exports for all repository interfaces and implementations
 */

// Factory Functions (Production Implementations)
import { createUserRepository } from "#infrastructure/repositories/drizzle/UserRepository";
export {
  createUserRepository,
  type UserRepository,
} from "#infrastructure/repositories/drizzle/UserRepository";

// Singleton Instances
import { db } from "#db/client";
/**
 * Singleton user repository instance
 */
export const userRepository = createUserRepository(db);
