import { db } from "#db/client";
import type { NewTransaction, Transaction } from "#db/schema";
import { transactions } from "#db/schema";
import { desc, eq, or, sql } from "drizzle-orm";

/**
 * Creates a Drizzle ORM implementation of Transaction Repository
 *
 * @function createTransactionRepository
 * @param {typeof db} dbInstance - The Drizzle database instance
 * @returns Transaction repository implementation
 */
export function createTransactionRepository(dbInstance: typeof db) {
  return {
    /**
     * Create a new transaction record
     */
    create: (data: NewTransaction) => {
      return dbInstance.insert(transactions).values(data).returning();
    },

    /**
     * Find transaction by ID
     */
    findById: (id: string): Promise<Transaction[]> => {
      return dbInstance
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);
    },

    /**
     * Find transactions by wallet ID (sent or received)
     */
    findByWalletId: (
      walletId: string,
      limit = 50,
      offset = 0,
    ): Promise<Transaction[]> => {
      return dbInstance
        .select()
        .from(transactions)
        .where(
          or(
            eq(transactions.fromWalletId, walletId),
            eq(transactions.toWalletId, walletId),
          ),
        )
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset);
    },

    /**
     * Count transactions by wallet ID
     */
    countByWalletId: async (walletId: string): Promise<number> => {
      const result = await dbInstance
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(
          or(
            eq(transactions.fromWalletId, walletId),
            eq(transactions.toWalletId, walletId),
          ),
        );

      return result[0]?.count ?? 0;
    },

    /**
     * Find transactions sent from a wallet
     */
    findSentByWalletId: (
      walletId: string,
      limit = 50,
      offset = 0,
    ): Promise<Transaction[]> => {
      return dbInstance
        .select()
        .from(transactions)
        .where(eq(transactions.fromWalletId, walletId))
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset);
    },

    /**
     * Find transactions received by a wallet
     */
    findReceivedByWalletId: (
      walletId: string,
      limit = 50,
      offset = 0,
    ): Promise<Transaction[]> => {
      return dbInstance
        .select()
        .from(transactions)
        .where(eq(transactions.toWalletId, walletId))
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset);
    },

    /**
     * Create a repository instance bound to a transaction
     */
    withTransaction: (tx: unknown) =>
      createTransactionRepository(tx as typeof db),
  };
}

export type TransactionRepository = ReturnType<
  typeof createTransactionRepository
>;

/**
 * Singleton transaction repository instance
 */
export const transactionRepository = createTransactionRepository(db);
