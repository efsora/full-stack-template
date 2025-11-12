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

export {
  createCurrencyRepository,
  type CurrencyRepository,
} from "#infrastructure/repositories/drizzle/CurrencyRepository";

export {
  createWalletRepository,
  type WalletRepository,
} from "#infrastructure/repositories/drizzle/WalletRepository";

export {
  createTransactionRepository,
  type TransactionRepository,
} from "#infrastructure/repositories/drizzle/TransactionRepository";

// Singleton Instances
import { db } from "#db/client";

/**
 * Singleton user repository instance
 */
export const userRepository = createUserRepository(db);

/**
 * Singleton currency repository instance
 */
export { currencyRepository } from "#infrastructure/repositories/drizzle/CurrencyRepository";

/**
 * Singleton wallet repository instance
 */
export { walletRepository } from "#infrastructure/repositories/drizzle/WalletRepository";

/**
 * Singleton transaction repository instance
 */
export { transactionRepository } from "#infrastructure/repositories/drizzle/TransactionRepository";
