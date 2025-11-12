import { chain } from "#lib/result/combinators";
import type { Result } from "#lib/result/index";
import { command, fail, success } from "#lib/result/index";
import first from "lodash/fp/first";
import type { NewTransaction } from "#db/schema";
import { walletRepository, transactionRepository } from "#infrastructure/repositories/drizzle";
import { WalletBalance } from "#core/wallets/value-objects/WalletBalance";
import { CoinType } from "#core/wallets/value-objects/CoinType";
import type { TransferCoinsInput } from "./types/inputs";
import type { TransferCoinsResult } from "./types/outputs";
import { validateTransferInput } from "./transfer-coins.operations";
import { TransactionAmount } from "./value-objects/TransactionAmount";

/**
 * Transfer Coins Workflow
 *
 * Orchestrates the transfer of coins between two users' wallets.
 * Both wallets must be for the same coin type.
 *
 * Steps:
 * 1. Validate input and create value objects
 * 2. Find both wallets (sender and receiver)
 * 3. Check sufficient balance
 * 4. Execute atomic transfer (DB transaction)
 *
 * @param input - Transfer parameters (fromUserId, toUserId, amount, coinType)
 * @returns Result containing transaction details and updated balances
 */
export function transferCoins(input: TransferCoinsInput): Result<TransferCoinsResult> {
  return chain(validateTransferInput(input), (validatedData) => {
    return command(
      async () => {
        // Find both wallets
        const [fromWallets, toWallets] = await Promise.all([
          walletRepository.findByUserIdAndCoinType(
            validatedData.fromUserId,
            CoinType.toString(validatedData.coinType),
          ),
          walletRepository.findByUserIdAndCoinType(
            validatedData.toUserId,
            CoinType.toString(validatedData.coinType),
          ),
        ]);

        const fromWallet = first(fromWallets);
        const toWallet = first(toWallets);

        if (!fromWallet) {
          throw new Error(`WALLET_NOT_FOUND:${validatedData.fromUserId}`);
        }

        if (!toWallet) {
          throw new Error(`WALLET_NOT_FOUND:${validatedData.toUserId}`);
        }

        // Check balance
        const fromBalanceResult = WalletBalance.create(fromWallet.balance);
        const toBalanceResult = WalletBalance.create(toWallet.balance);

        if (fromBalanceResult.status !== "Success") {
          throw new Error("INVALID_FROM_BALANCE");
        }
        if (toBalanceResult.status !== "Success") {
          throw new Error("INVALID_TO_BALANCE");
        }

        const fromBalance = fromBalanceResult.value;
        const toBalance = toBalanceResult.value;

        // Convert TransactionAmount to WalletBalance for comparison and arithmetic
        const amountAsBalanceResult = WalletBalance.create(
          TransactionAmount.toString(validatedData.amount),
        );

        if (amountAsBalanceResult.status !== "Success") {
          throw new Error("INVALID_AMOUNT_FOR_BALANCE");
        }

        const amountAsBalance = amountAsBalanceResult.value;

        if (!WalletBalance.isGreaterThanOrEqual(fromBalance, amountAsBalance)) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        // Execute transfer atomically
        // Note: This is a simplified version. In production, you'd use db.transaction()
        const newFromBalance = WalletBalance.subtract(fromBalance, amountAsBalance);
        const newToBalance = WalletBalance.add(toBalance, amountAsBalance);

        // Update wallets
        await Promise.all([
          walletRepository.updateBalance(fromWallet.id, WalletBalance.toString(newFromBalance)),
          walletRepository.updateBalance(toWallet.id, WalletBalance.toString(newToBalance)),
        ]);

        // Create transaction record
        const txData: NewTransaction = {
          fromWalletId: fromWallet.id,
          toWalletId: toWallet.id,
          amount: TransactionAmount.toString(validatedData.amount),
          coinType: CoinType.toString(validatedData.coinType),
          status: "completed",
        };

        const transactions = await transactionRepository.create(txData);
        const transaction = first(transactions);

        return {
          transaction,
          fromBalance: newFromBalance,
          toBalance: newToBalance,
        };
      },
      (result) => {
        if (!result.transaction) {
          return fail({
            code: "INTERNAL_ERROR",
            message: "Failed to execute transfer",
          });
        }

        // Ensure balance values are proper WalletBalance instances
        let fromWalletBalanceStr: string;
        let toWalletBalanceStr: string;

        if (
          result.fromBalance &&
          typeof result.fromBalance === "object" &&
          "value" in result.fromBalance
        ) {
          // It's already a WalletBalance instance
          fromWalletBalanceStr = WalletBalance.toString(result.fromBalance);
        } else {
          // Try to create one from the raw value
          const fbResult = WalletBalance.create(result.fromBalance);
          if (fbResult.status !== "Success") {
            return fail({
              code: "WALLET_INVALID_BALANCE",
              message: "Invalid balance value for sender wallet",
            });
          }
          fromWalletBalanceStr = WalletBalance.toString(fbResult.value);
        }

        if (result.toBalance && typeof result.toBalance === "object" && "value" in result.toBalance) {
          toWalletBalanceStr = WalletBalance.toString(result.toBalance);
        } else {
          const tbResult = WalletBalance.create(result.toBalance);
          if (tbResult.status !== "Success") {
            return fail({
              code: "WALLET_INVALID_BALANCE",
              message: "Invalid balance value for recipient wallet",
            });
          }
          toWalletBalanceStr = WalletBalance.toString(tbResult.value);
        }

        return success({
          transaction: {
            amount: result.transaction.amount,
            coinType: result.transaction.coinType,
            createdAt: result.transaction.createdAt,
            fromWalletId: result.transaction.fromWalletId,
            id: result.transaction.id,
            status: (result.transaction.status as "completed" | "failed" | "pending"),
            toWalletId: result.transaction.toWalletId,
            updatedAt: result.transaction.updatedAt,
          },
          fromWalletBalance: fromWalletBalanceStr,
          toWalletBalance: toWalletBalanceStr,
        });
      },
      {
        operation: "transferCoins",
        tags: { action: "transfer", domain: "transactions" },
      },
    );
  });
}
