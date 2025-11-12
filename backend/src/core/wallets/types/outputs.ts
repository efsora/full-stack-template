/**
 * Output types for Wallets domain
 *
 * These types represent data returned to external consumers (HTTP responses).
 * They typically exclude sensitive fields and use safe representations.
 */

/**
 * Public wallet data
 * Safe for API responses
 */
export type WalletData = {
  balance: string;
  coinType: string;
  createdAt: Date;
  id: string;
  updatedAt: Date;
  userId: string;
};

/**
 * Result of wallet creation
 */
export type CreateWalletResult = WalletData;

/**
 * Result of wallet retrieval (single wallet)
 */
export type GetWalletResult = WalletData;

/**
 * Result of retrieving all wallets for a user
 */
export type GetUserWalletsResult = WalletData[];
