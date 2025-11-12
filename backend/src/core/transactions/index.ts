/**
 * Transactions Module
 * Public API for transaction operations
 */

// Workflows
export { transferCoins } from "./transfer-coins.workflow";
export { getTransactionHistory } from "./get-transaction-history.workflow";

// Public types - Inputs
export type { TransferCoinsInput, GetTransactionHistoryInput } from "./types/inputs";

// Public types - Outputs
export type { TransactionData, TransferCoinsResult, GetTransactionHistoryResult } from "./types/outputs";

// Public types - Errors
export type { TransactionError, TransactionInvalidAmountError, TransactionInsufficientBalanceError, TransactionCoinTypeMismatchError, TransactionWalletNotFoundError } from "./types/errors";

// Value objects
export { TransactionAmount } from "./value-objects/TransactionAmount";

// Note: operations, internal types, and other implementation details are intentionally NOT exported
// Handlers should only use workflows from this barrel file
