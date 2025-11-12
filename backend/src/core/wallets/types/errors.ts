/**
 * Wallet Domain Error Types
 *
 * Defines all error types specific to the wallets domain.
 * Each error has a domain-specific code that encodes both the domain and error type.
 */

import type { ErrorBase } from "#lib/result/types/errors";

/**
 * Union of all wallet domain errors.
 * Use this type when handling wallet-specific errors.
 */
export type WalletError =
  | WalletAlreadyExistsError
  | WalletInsufficientBalanceError
  | WalletInvalidBalanceError
  | WalletInvalidCoinTypeError
  | WalletNotFoundError;

/**
 * Wallet not found error - requested wallet doesn't exist.
 * Used when querying for a wallet that doesn't exist in the database.
 *
 * @example
 * ```typescript
 * fail({
 *   code: "WALLET_NOT_FOUND",
 *   message: "Wallet not found for this user"
 * })
 * ```
 */
export type WalletNotFoundError = ErrorBase & {
  code: "WALLET_NOT_FOUND";
};

/**
 * Wallet already exists error - user already has a wallet.
 * Used when attempting to create a second wallet for a user.
 *
 * @example
 * ```typescript
 * fail({
 *   code: "WALLET_ALREADY_EXISTS",
 *   message: "User already has a wallet"
 * })
 * ```
 */
export type WalletAlreadyExistsError = ErrorBase & {
  code: "WALLET_ALREADY_EXISTS";
};

/**
 * Wallet insufficient balance error - not enough funds for operation.
 * Used when attempting to deduct more than available balance.
 *
 * @example
 * ```typescript
 * fail({
 *   code: "WALLET_INSUFFICIENT_BALANCE",
 *   message: "Insufficient balance for this operation"
 * })
 * ```
 */
export type WalletInsufficientBalanceError = ErrorBase & {
  code: "WALLET_INSUFFICIENT_BALANCE";
};

/**
 * Wallet invalid balance error - balance value is invalid.
 * Used when balance validation fails (negative, invalid format, etc.).
 *
 * @example
 * ```typescript
 * fail({
 *   code: "WALLET_INVALID_BALANCE",
 *   message: "Balance cannot be negative"
 * })
 * ```
 */
export type WalletInvalidBalanceError = ErrorBase & {
  code: "WALLET_INVALID_BALANCE";
};

/**
 * Wallet invalid coin type error - coin type is not supported or not active.
 * Used when attempting to create a wallet with an unsupported or inactive currency.
 *
 * @example
 * ```typescript
 * fail({
 *   code: "WALLET_INVALID_COIN_TYPE",
 *   message: "Currency 'XYZ' is not supported"
 * })
 * ```
 */
export type WalletInvalidCoinTypeError = ErrorBase & {
  code: "WALLET_INVALID_COIN_TYPE";
};
