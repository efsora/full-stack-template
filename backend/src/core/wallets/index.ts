/**
 * Wallets Module
 * Public API for wallet operations
 */

// Workflows
export { createWallet } from "./create-wallet.workflow";
export { getWallet } from "./get-wallet.workflow";
export { getUserWallets } from "./get-user-wallets.workflow";

// Public types - Inputs
export type { CreateWalletInput, GetWalletInput, GetUserWalletsInput } from "./types/inputs";

// Public types - Outputs
export type { WalletData, CreateWalletResult, GetWalletResult, GetUserWalletsResult } from "./types/outputs";

// Public types - Errors
export type { WalletError, WalletInvalidCoinTypeError } from "./types/errors";

// Value objects
export { CoinType } from "./value-objects/CoinType";
export { WalletBalance } from "./value-objects/WalletBalance";

// Note: operations, internal types, and other implementation details are intentionally NOT exported
// Handlers should only use workflows from this barrel file
