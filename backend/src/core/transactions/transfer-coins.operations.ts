import { walletRepository } from "#infrastructure/repositories/drizzle";
import { allNamed, chain } from "#lib/result/combinators";
import { command, fail, success, type Result } from "#lib/result/index";
import { WalletBalance } from "#core/wallets/value-objects/WalletBalance";
import { CoinType } from "#core/wallets/value-objects/CoinType";
import { TransactionAmount } from "./value-objects/TransactionAmount";
import type { TransferCoinsInput } from "./types/inputs";
import type { ValidatedTransferData, WalletsForTransfer } from "./types/internal";

/**
 * Validates transfer input and creates value objects
 */
export function validateTransferInput(
  input: TransferCoinsInput,
): Result<ValidatedTransferData> {
  return chain(
    allNamed({
      amount: TransactionAmount.create(input.amount),
      coinType: CoinType.create(input.coinType),
    }),
    (result) =>
      success({
        amount: result.amount,
        coinType: result.coinType,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
      }),
  );
}

/**
 * Finds wallets for transfer (both sender and receiver)
 */
export function findWalletsForTransfer(
  data: ValidatedTransferData,
): Result<WalletsForTransfer> {
  return command(
    async () => {
      const [fromWallets, toWallets] = await Promise.all([
        walletRepository.findByUserIdAndCoinType(
          data.fromUserId,
          CoinType.toString(data.coinType),
        ),
        walletRepository.findByUserIdAndCoinType(
          data.toUserId,
          CoinType.toString(data.coinType),
        ),
      ]);

      const fromWallet: unknown = fromWallets.length > 0 ? fromWallets[0] : undefined;
      const toWallet: unknown = toWallets.length > 0 ? toWallets[0] : undefined;

      return { from: fromWallet, to: toWallet };
    },
    (result: { from?: unknown; to?: unknown }) => {
      const fromWallet = result.from;
      const toWallet = result.to;

      if (!fromWallet || typeof fromWallet !== "object") {
        return fail({
          code: "TRANSACTION_WALLET_NOT_FOUND",
          message: `Sender wallet not found for user ${data.fromUserId}`,
        });
      }

      if (!toWallet || typeof toWallet !== "object") {
        return fail({
          code: "TRANSACTION_WALLET_NOT_FOUND",
          message: `Recipient wallet not found for user ${data.toUserId}`,
        });
      }

      const fromWalletObj = fromWallet as {
        balance: string;
        coinType: string;
        id: string;
        userId: string;
      };
      const toWalletObj = toWallet as {
        balance: string;
        coinType: string;
        id: string;
        userId: string;
      };

      const fromBalanceResult = WalletBalance.create(fromWalletObj.balance);
      const toBalanceResult = WalletBalance.create(toWalletObj.balance);

      // Handle balance creation failures
      if (fromBalanceResult.status === "Failure") {
        return fail({
          code: "WALLET_INVALID_BALANCE",
          message: "Invalid balance for sender wallet",
        });
      }

      if (toBalanceResult.status === "Failure") {
        return fail({
          code: "WALLET_INVALID_BALANCE",
          message: "Invalid balance for recipient wallet",
        });
      }

      // Extract WalletBalance values from Success results
      const fromBalance = fromBalanceResult.status === "Success" ? fromBalanceResult.value : null;
      const toBalance = toBalanceResult.status === "Success" ? toBalanceResult.value : null;

      if (!fromBalance || !toBalance) {
        return fail({
          code: "WALLET_INVALID_BALANCE",
          message: "Invalid balance values for wallets",
        });
      }

      return success({
        fromWallet: {
          balance: fromBalance,
          coinType: data.coinType,
          id: fromWalletObj.id,
          userId: fromWalletObj.userId,
        },
        toWallet: {
          balance: toBalance,
          coinType: data.coinType,
          id: toWalletObj.id,
          userId: toWalletObj.userId,
        },
      } as WalletsForTransfer);
    },
    {
      operation: "findWalletsForTransfer",
      tags: { action: "find", domain: "transactions" },
    },
  );
}

/**
 * Validates same coin type for both wallets
 */
export function validateSameCoinType(
  data: ValidatedTransferData & { wallets: WalletsForTransfer },
): Result<ValidatedTransferData & { wallets: WalletsForTransfer }> {
  if (
    !CoinType.isEqual(data.coinType, data.wallets.fromWallet.coinType) ||
    !CoinType.isEqual(data.coinType, data.wallets.toWallet.coinType)
  ) {
    return fail({
      code: "TRANSACTION_COIN_TYPE_MISMATCH",
      message: "Both wallets must use the same coin type",
    });
  }
  return success(data);
}

/**
 * Checks sufficient balance
 */
export function checkSufficientBalance(
  data: ValidatedTransferData & { wallets: WalletsForTransfer },
): Result<ValidatedTransferData & { wallets: WalletsForTransfer }> {
  // Convert TransactionAmount to string for comparison with WalletBalance
  const amountStr = TransactionAmount.toString(data.amount);

  // Create a WalletBalance from the amount string for comparison
  const amountAsBalanceResult = WalletBalance.create(amountStr);

  if (amountAsBalanceResult.status !== "Success") {
    return fail({
      code: "WALLET_INVALID_BALANCE",
      message: "Invalid amount for balance comparison",
    });
  }

  const amountAsBalance = amountAsBalanceResult.value;

  if (
    !WalletBalance.isGreaterThanOrEqual(
      data.wallets.fromWallet.balance,
      amountAsBalance,
    )
  ) {
    return fail({
      code: "TRANSACTION_INSUFFICIENT_BALANCE",
      message: "Insufficient balance for this transfer",
    });
  }
  return success(data);
}
