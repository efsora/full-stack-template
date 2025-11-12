/**
 * Input types for Transactions domain
 *
 * These types represent data coming from external sources (HTTP requests, API calls).
 * They are typically validated by Zod schemas in route handlers before reaching the core.
 */

/**
 * Input for transferring coins between users
 */
export type TransferCoinsInput = {
  amount: number;
  coinType: string;
  fromUserId: string;
  toUserId: string;
};

/**
 * Input for getting transaction history
 */
export type GetTransactionHistoryInput = {
  limit?: number;
  offset?: number;
  userId: string;
};
