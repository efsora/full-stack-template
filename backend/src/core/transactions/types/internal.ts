/**
 * Internal types for Transactions domain
 *
 * These types are used internally within the domain and should NOT be exported
 * from the barrel file (index.ts). They represent intermediate states and
 * implementation details.
 */

import type { CoinType } from "#core/wallets/value-objects/CoinType";
import type { WalletBalance } from "#core/wallets/value-objects/WalletBalance";

import type { TransactionAmount } from "../value-objects/TransactionAmount";

/**
 * Validated transfer input with value objects
 * Used internally after input validation
 */
export type ValidatedTransferData = {
  amount: TransactionAmount;
  coinType: CoinType;
  fromUserId: string;
  toUserId: string;
};

/**
 * Wallet with typed balance
 */
export type WalletWithBalance = {
  balance: WalletBalance;
  coinType: CoinType;
  id: string;
  userId: string;
};

/**
 * Wallets involved in a transfer
 * Used internally during transfer execution
 */
export type WalletsForTransfer = {
  fromWallet: WalletWithBalance;
  toWallet: WalletWithBalance;
};

/**
 * Transaction record data
 * Used internally after transaction creation
 */
export type TransactionRecord = {
  amount: string;
  fromWalletId: string;
  id: string;
  status: "completed";
  toWalletId: string;
};

/**
 * Complete transfer result with all data
 * Used internally to pass data between operations
 */
export type CompleteTransferData = {
  receiverNewBalance: WalletBalance;
  senderNewBalance: WalletBalance;
  transaction: TransactionRecord;
};
