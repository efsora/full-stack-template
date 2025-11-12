/**
 * Input types for Wallets domain
 *
 * These types represent data coming from external sources (HTTP requests, API calls).
 * They are typically validated by Zod schemas in route handlers before reaching the core.
 */

/**
 * Input for creating a new wallet
 */
export type CreateWalletInput = {
  coinType: string;
  initialBalance?: number;
  userId: string;
};

/**
 * Input for getting a wallet by user ID and coin type
 */
export type GetWalletInput = {
  coinType: string;
  userId: string;
};

/**
 * Input for getting all wallets for a user
 */
export type GetUserWalletsInput = {
  userId: string;
};
