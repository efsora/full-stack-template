/**
 * Internal types for Wallets domain
 *
 * These types are used internally within the domain and should NOT be exported
 * from the barrel file (index.ts). They represent intermediate states and
 * implementation details.
 */

import type { CoinType } from "../value-objects/CoinType";
import type { WalletBalance } from "../value-objects/WalletBalance";

/**
 * Validated wallet creation data
 * Used internally after input validation
 */
export type ValidatedWalletCreation = {
  balance: WalletBalance;
  coinType: CoinType;
  userId: string;
};

/**
 * Wallet with typed balance
 * Used internally for operations requiring balance calculations
 */
export type WalletWithBalance = {
  balance: WalletBalance;
  coinType: CoinType;
  id: string;
  userId: string;
};
