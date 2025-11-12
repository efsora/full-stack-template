import first from "lodash/fp/first";

import { walletRepository } from "#infrastructure/repositories/drizzle";
import { command, fail, success, type Result } from "#lib/result/index";

import type { GetWalletInput, GetUserWalletsInput } from "./types/inputs";
import type { GetWalletResult, GetUserWalletsResult } from "./types/outputs";
import { Wallet } from "#db/schema.js";

/**
 * Validates get wallet input
 * Simple pass-through for now, but allows for future validation
 */
export function validateGetWallet(
  input: GetWalletInput,
): Result<GetWalletInput> {
  return success(input);
}

/**
 * Continuation function for findWalletByUserId operation.
 * Handles the result of wallet retrieval from the database.
 *
 * @param wallet - Wallet returned from database or undefined if not found
 * @returns Result with GetWalletResult on success, or Failure on error
 */
export function handleFindWalletByUserIdResult(wallet: Wallet | undefined) {
  if (!wallet) {
    return fail({
      code: "WALLET_NOT_FOUND",
      message: "Wallet not found for this user",
    });
  }

  return success({
    balance: wallet.balance,
    coinType: wallet.coinType,
    createdAt: wallet.createdAt,
    id: wallet.id,
    updatedAt: wallet.updatedAt,
    userId: wallet.userId,
  });
}

/**
 * Finds wallet by user ID
 */
export function findWalletByUserId(
  input: GetWalletInput,
): Result<GetWalletResult> {
  return command(
    async () => {
      const wallets = await walletRepository.findByUserId(input.userId);
      return first(wallets);
    },
    handleFindWalletByUserIdResult,
    {
      operation: "findWalletByUserId",
      tags: { action: "find", domain: "wallets" },
    },
  );
}

/**
 * Validates get user wallets input
 * Simple pass-through for now, but allows for future validation
 */
export function validateGetUserWallets(
  input: GetUserWalletsInput,
): Result<GetUserWalletsInput> {
  return success(input);
}

/**
 * Finds all wallets for a user across all coin types
 */
export function findAllUserWallets(
  input: GetUserWalletsInput,
): Result<GetUserWalletsResult> {
  return command(
    async () => {
      return await walletRepository.findAllByUserId(input.userId);
    },
    (wallets) => {
      return success(
        wallets.map((wallet) => ({
          balance: wallet.balance,
          coinType: wallet.coinType,
          createdAt: wallet.createdAt,
          id: wallet.id,
          updatedAt: wallet.updatedAt,
          userId: wallet.userId,
        })),
      );
    },
    {
      operation: "findAllUserWallets",
      tags: { action: "find-all", domain: "wallets" },
    },
  );
}
