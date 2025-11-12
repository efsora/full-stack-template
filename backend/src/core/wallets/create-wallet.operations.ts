import first from "lodash/fp/first";

import type { NewWallet, Wallet } from "#db/schema";
import { walletRepository } from "#infrastructure/repositories/drizzle";
import { chain } from "#lib/result/combinators";
import { command, fail, success, type Result } from "#lib/result/index";

import type { CreateWalletInput } from "./types/inputs";
import type { CreateWalletResult } from "./types/outputs";
import type { ValidatedWalletCreation } from "./types/internal";
import { WalletBalance } from "./value-objects/WalletBalance";
import { CoinType } from "./value-objects/CoinType";
import { allNamed } from "#lib/result/combinators";

/**
 * Validates wallet creation input
 * Creates WalletBalance and CoinType value objects
 */
export function validateWalletCreation(
  input: CreateWalletInput,
): Result<ValidatedWalletCreation> {
  const initialBalance = input.initialBalance ?? 0;

  return chain(
    allNamed({
      balance: WalletBalance.create(initialBalance),
      coinType: CoinType.create(input.coinType),
    }),
    (result) =>
      success({
        balance: result.balance,
        coinType: result.coinType,
        userId: input.userId,
      }),
  );
}

/**
 * Checks if user already has a wallet for this coin type
 * Returns Failure if wallet exists for the coin type
 */
export function checkWalletDoesNotExist(
  data: ValidatedWalletCreation,
): Result<ValidatedWalletCreation> {
  return command(
    async () => {
      const wallets = await walletRepository.findByUserIdAndCoinType(
        data.userId,
        CoinType.toString(data.coinType),
      );
      return first(wallets);
    },
    (existingWallet) => {
      if (existingWallet) {
        return fail({
          code: "WALLET_ALREADY_EXISTS",
          message: `User already has a wallet for ${CoinType.toString(data.coinType)}`,
        });
      }
      return success(data);
    },
    {
      operation: "checkWalletDoesNotExist",
      tags: { action: "check", domain: "wallets" },
    },
  );
}

/**
 * Continuation function for saveNewWallet operation.
 * Handles the result of wallet creation in the database.
 *
 * @param wallet - Wallet returned from database or undefined if creation failed
 * @returns Result with CreateWalletResult on success, or Failure on error
 */
export function handleSaveNewWalletResult(wallet: Wallet | undefined) {
  if (!wallet) {
    return fail({
      code: "INTERNAL_ERROR",
      message: "Failed to create wallet",
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
 * Saves new wallet to database
 */
export function saveNewWallet(
  data: ValidatedWalletCreation,
): Result<CreateWalletResult> {
  return command(
    async () => {
      const walletData: NewWallet = {
        balance: WalletBalance.toString(data.balance),
        coinType: CoinType.toString(data.coinType),
        userId: data.userId,
      };

      const wallets = await walletRepository.create(walletData);
      return first(wallets);
    },
    handleSaveNewWalletResult,
    {
      operation: "saveNewWallet",
      tags: { action: "create", domain: "wallets" },
    },
  );
}
