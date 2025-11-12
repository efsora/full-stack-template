import { pipe } from "#lib/result/combinators";
import type { Result } from "#lib/result/index";
import type { CreateWalletInput } from "./types/inputs";
import type { CreateWalletResult } from "./types/outputs";
import {
  validateWalletCreation,
  checkWalletDoesNotExist,
  saveNewWallet,
} from "./create-wallet.operations";

/**
 * Create Wallet Workflow
 *
 * Orchestrates the creation of a new wallet for a user in a specific coin type.
 * Since each user can have multiple wallets (one per coin type), this allows
 * creating additional wallets for different currencies.
 *
 * Steps:
 * 1. Validate input (userId, coinType, initialBalance)
 * 2. Check wallet doesn't already exist for this (userId, coinType)
 * 3. Save new wallet to database
 *
 * @param input - Wallet creation data
 * @returns Result containing wallet data
 */
export function createWallet(input: CreateWalletInput): Result<CreateWalletResult> {
  return pipe(
    validateWalletCreation(input),
    checkWalletDoesNotExist,
    saveNewWallet,
  );
}
