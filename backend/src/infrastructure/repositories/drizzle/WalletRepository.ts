import { db } from "#db/client";
import type { NewWallet, Wallet } from "#db/schema";
import { wallets } from "#db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Creates a Drizzle ORM implementation of Wallet Repository
 *
 * @function createWalletRepository
 * @param {typeof db} dbInstance - The Drizzle database instance
 * @returns Wallet repository implementation
 */
export function createWalletRepository(dbInstance: typeof db) {
  return {
    /**
     * Create a new wallet
     */
    create: (data: NewWallet) => {
      return dbInstance.insert(wallets).values(data).returning();
    },

    /**
     * Find wallet by user ID and coin type
     */
    findByUserIdAndCoinType: (
      userId: string,
      coinType: string,
    ): Promise<Wallet[]> => {
      return dbInstance
        .select()
        .from(wallets)
        .where(and(eq(wallets.userId, userId), eq(wallets.coinType, coinType)))
        .limit(1);
    },

    /**
     * Find all wallets for a user (across all coin types)
     */
    findAllByUserId: (userId: string): Promise<Wallet[]> => {
      return dbInstance
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId));
    },

    /**
     * Find wallet by user ID (deprecated - use findByUserIdAndCoinType)
     * Returns first wallet found (for backward compatibility)
     */
    findByUserId: (userId: string): Promise<Wallet[]> => {
      return dbInstance
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .limit(1);
    },

    /**
     * Find wallet by wallet ID
     */
    findById: (id: string): Promise<Wallet[]> => {
      return dbInstance
        .select()
        .from(wallets)
        .where(eq(wallets.id, id))
        .limit(1);
    },

    /**
     * Update wallet balance
     */
    updateBalance: (id: string, newBalance: string) => {
      return dbInstance
        .update(wallets)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(wallets.id, id))
        .returning();
    },

    /**
     * Delete a wallet
     */
    delete: (id: string) => {
      return dbInstance.delete(wallets).where(eq(wallets.id, id)).returning();
    },

    /**
     * Create a repository instance bound to a transaction
     */
    withTransaction: (tx: unknown) => createWalletRepository(tx as typeof db),
  };
}

export type WalletRepository = ReturnType<typeof createWalletRepository>;

/**
 * Singleton wallet repository instance
 */
export const walletRepository = createWalletRepository(db);
