import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Users Table
 * Stores user account information
 */
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

/**
 * Currencies Table
 * Stores supported currency/coin types with metadata
 */
export const currencies = pgTable("currencies", {
  code: text("code").primaryKey(), // USD, EUR, BTC, ETH
  name: text("name").notNull(), // US Dollar, Euro, Bitcoin, Ethereum
  symbol: text("symbol").notNull(), // $, €, ₿, Ξ
  type: text("type").notNull(), // fiat, crypto
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;

/**
 * Wallets Table
 * Stores user wallet information with coin balances
 * One wallet per user per coin type
 */
export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    coinType: text("coin_type")
      .notNull()
      .references(() => currencies.code, { onDelete: "restrict" })
      .default("USD"),
    balance: numeric("balance", { precision: 20, scale: 2 })
      .notNull()
      .default("0.00"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    {
      // One wallet per user per coin type
      userCoinIdx: uniqueIndex("idx_wallets_user_coin").on(
        table.userId,
        table.coinType,
      ),
      coinTypeIdx: index("idx_wallets_coin_type").on(table.coinType),
      balanceIdx: index("idx_wallets_balance").on(table.balance),
    },
  ],
);

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;

/**
 * Transactions Table
 * Stores coin transfer transactions between wallets
 */
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    fromWalletId: uuid("from_wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    toWalletId: uuid("to_wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
    coinType: text("coin_type")
      .notNull()
      .references(() => currencies.code, { onDelete: "restrict" })
      .default("USD"),
    status: text("status").notNull().default("completed"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    {
      fromWalletIdx: index("idx_transactions_from_wallet").on(
        table.fromWalletId,
      ),
      toWalletIdx: index("idx_transactions_to_wallet").on(table.toWalletId),
      createdAtIdx: index("idx_transactions_created_at").on(table.createdAt),
      coinTypeIdx: index("idx_transactions_coin_type").on(table.coinType),
    },
  ],
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
