import { db } from "#db/client";
import type { Currency, NewCurrency } from "#db/schema";
import { currencies } from "#db/schema";
import { eq } from "drizzle-orm";

/**
 * Creates a Drizzle ORM implementation of Currency Repository
 *
 * @function createCurrencyRepository
 * @param {typeof db} dbInstance - The Drizzle database instance
 * @returns Currency repository implementation
 */
export function createCurrencyRepository(dbInstance: typeof db) {
  return {
    /**
     * Find currency by code
     */
    findByCode: (code: string): Promise<Currency[]> => {
      return dbInstance
        .select()
        .from(currencies)
        .where(eq(currencies.code, code))
        .limit(1);
    },

    /**
     * Find all active currencies
     */
    findAllActive: (): Promise<Currency[]> => {
      return dbInstance
        .select()
        .from(currencies)
        .where(eq(currencies.isActive, true));
    },

    /**
     * Find all currencies (including inactive)
     */
    findAll: (): Promise<Currency[]> => {
      return dbInstance.select().from(currencies);
    },

    /**
     * Create a new currency
     */
    create: (data: NewCurrency) => {
      return dbInstance.insert(currencies).values(data).returning();
    },

    /**
     * Update a currency
     */
    update: (code: string, data: Partial<NewCurrency>) => {
      return dbInstance
        .update(currencies)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(currencies.code, code))
        .returning();
    },

    /**
     * Deactivate a currency (soft delete)
     */
    deactivate: (code: string) => {
      return dbInstance
        .update(currencies)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(currencies.code, code))
        .returning();
    },

    /**
     * Create a repository instance bound to a transaction
     */
    withTransaction: (tx: unknown) =>
      createCurrencyRepository(tx as typeof db),
  };
}

export type CurrencyRepository = ReturnType<typeof createCurrencyRepository>;

/**
 * Singleton currency repository instance
 */
export const currencyRepository = createCurrencyRepository(db);
