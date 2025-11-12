import type { Result } from "#lib/result/index";
import { command, fail, success } from "#lib/result/index";
import first from "lodash/fp/first";
import { walletRepository } from "#infrastructure/repositories/drizzle";
import type { GetWalletInput } from "./types/inputs";
import type { GetWalletResult } from "./types/outputs";

/**
 * Get Wallet Workflow
 *
 * Retrieves a specific wallet for a user and coin type.
 * Input validation is assumed to be done by the HTTP layer (Zod schemas).
 *
 * Steps:
 * 1. Find wallet by userId and coinType
 * 2. Format and return wallet data
 *
 * @param input - Wallet lookup parameters (userId, coinType)
 * @returns Result containing wallet data
 */
export function getWallet(input: GetWalletInput): Result<GetWalletResult> {
  return command(
    async () => {
      const wallets = await walletRepository.findByUserIdAndCoinType(
        input.userId,
        input.coinType,
      );
      return first(wallets);
    },
    (wallet) => {
      if (!wallet) {
        return fail({
          code: "WALLET_NOT_FOUND",
          message: `No wallet found for user ${input.userId} and coin type ${input.coinType}`,
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
    },
    {
      operation: "getWallet",
      tags: { action: "get", domain: "wallets" },
    },
  );
}
