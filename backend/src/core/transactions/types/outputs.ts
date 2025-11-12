/**
 * Output types for Transactions domain
 *
 * These types represent data returned to external consumers (HTTP responses).
 * They typically exclude sensitive fields and use safe representations.
 */

/**
 * Public transaction data
 * Safe for API responses
 */
export type TransactionData = {
  amount: string;
  coinType: string;
  createdAt: Date;
  fromWalletId: string;
  id: string;
  status: "completed" | "failed" | "pending";
  toWalletId: string;
  updatedAt: Date;
};

/**
 * Result of coin transfer
 * Includes transaction details and updated balances
 */
export type TransferCoinsResult = {
  fromWalletBalance: string;
  toWalletBalance: string;
  transaction: TransactionData;
};

/**
 * Result of transaction history query
 * Includes list of transactions and total count
 */
export type GetTransactionHistoryResult = {
  total: number;
  transactions: TransactionData[];
};
