/**
 * Transaction Domain Error Types
 *
 * Defines all error types specific to the transactions domain.
 */

import type { ErrorBase } from "#lib/result/types/errors";

/**
 * Union of all transaction domain errors.
 * Use this type when handling transaction-specific errors.
 */
export type TransactionError =
  | TransactionInvalidAmountError
  | TransactionInsufficientBalanceError
  | TransactionCoinTypeMismatchError
  | TransactionWalletNotFoundError;

/**
 * Transaction invalid amount error - amount is invalid
 */
export type TransactionInvalidAmountError = ErrorBase & {
  code: "TRANSACTION_INVALID_AMOUNT";
};

/**
 * Transaction insufficient balance error - sender doesn't have enough balance
 */
export type TransactionInsufficientBalanceError = ErrorBase & {
  code: "TRANSACTION_INSUFFICIENT_BALANCE";
};

/**
 * Transaction coin type mismatch error - wallets use different coin types
 */
export type TransactionCoinTypeMismatchError = ErrorBase & {
  code: "TRANSACTION_COIN_TYPE_MISMATCH";
};

/**
 * Transaction wallet not found error - wallet doesn't exist
 */
export type TransactionWalletNotFoundError = ErrorBase & {
  code: "TRANSACTION_WALLET_NOT_FOUND";
};
