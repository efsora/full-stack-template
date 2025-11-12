import type { Transaction } from "#db/schema";
import {
  walletRepository,
  transactionRepository,
} from "#infrastructure/repositories/drizzle";
import { command, fail, success, type Result } from "#lib/result/index";

import type { GetTransactionHistoryInput } from "./types/inputs";
import type { GetTransactionHistoryResult, TransactionData } from "./types/outputs";

/**
 * Internal type for passing wallet IDs through the pipeline
 */
type UserWalletsData = {
  limit: number;
  offset: number;
  userId: string;
  walletIds: string[];
};

/**
 * Internal type for passing transactions through the pipeline
 */
type TransactionsData = {
  total: number;
  transactions: Transaction[];
};

/**
 * Validates transaction history input and sets defaults
 *
 * FCIS: Pure function (no side effects)
 * Note: Validation is primarily done by Zod schemas at HTTP layer.
 * This function just sets defaults for pagination parameters.
 *
 * @param input - Transaction history request data
 * @returns Result with normalized input (defaults applied)
 */
export function validateGetTransactionHistory(
  input: GetTransactionHistoryInput,
): Result<GetTransactionHistoryInput> {
  // Set default pagination values
  const normalized = {
    userId: input.userId,
    limit: input.limit ?? 10,
    offset: input.offset ?? 0,
  };

  return success(normalized);
}

/**
 * Finds all wallets for a user
 *
 * FCIS: Side effect (database query) wrapped in command()
 *
 * @param input - User ID and pagination parameters
 * @returns Result with user ID and array of wallet IDs
 */
export function findUserWallets(
  input: GetTransactionHistoryInput,
): Result<UserWalletsData> {
  return command(
    async () => {
      const wallets = await walletRepository.findAllByUserId(input.userId);
      return wallets;
    },
    (wallets) => {
      if (wallets.length === 0) {
        return fail({
          code: "WALLET_NOT_FOUND",
          message: `No wallets found for user ${input.userId}`,
        });
      }

      const walletIds = wallets.map((wallet) => wallet.id);

      return success({
        userId: input.userId,
        walletIds,
        limit: input.limit ?? 10,
        offset: input.offset ?? 0,
      });
    },
    {
      operation: "findUserWallets",
      tags: { action: "find", domain: "transactions" },
    },
  );
}

/**
 * Finds transactions for all user wallets with pagination
 *
 * FCIS: Side effect (database queries) wrapped in command()
 * Aggregates transactions from all wallets, sorts, and paginates
 *
 * @param data - User ID, wallet IDs, and pagination parameters
 * @returns Result with transactions and total count
 */
export function findTransactionsForWallets(
  data: UserWalletsData,
): Result<TransactionsData> {
  return command(
    async () => {
      // Fetch transactions for all wallets in parallel
      const transactionPromises = data.walletIds.map((walletId) =>
        transactionRepository.findByWalletId(walletId, 1000, 0),
      );

      const countPromises = data.walletIds.map((walletId) =>
        transactionRepository.countByWalletId(walletId),
      );

      const [transactionResults, countResults] = await Promise.all([
        Promise.all(transactionPromises),
        Promise.all(countPromises),
      ]);

      // Combine all transactions
      const allTransactions = transactionResults.flat();

      // Calculate total count
      const totalCount = countResults.reduce((sum, count) => sum + count, 0);

      // Sort by createdAt descending (newest first)
      const sorted = allTransactions.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Apply pagination
      const paginated = sorted.slice(data.offset, data.offset + data.limit);

      return {
        transactions: paginated,
        total: totalCount,
      };
    },
    (result) => {
      return success({
        transactions: result.transactions,
        total: result.total,
      });
    },
    {
      operation: "findTransactionsForWallets",
      tags: { action: "find", domain: "transactions" },
    },
  );
}

/**
 * Formats transactions into API response format
 *
 * FCIS: Pure transformation function (no side effects)
 *
 * @param data - Transactions and total count from database
 * @returns Result with formatted transaction history
 */
export function formatTransactionHistory(
  data: TransactionsData,
): Result<GetTransactionHistoryResult> {
  const formattedTransactions: TransactionData[] = data.transactions.map((tx) => ({
    id: tx.id,
    fromWalletId: tx.fromWalletId,
    toWalletId: tx.toWalletId,
    amount: tx.amount,
    coinType: tx.coinType,
    status: tx.status as "completed" | "failed" | "pending",
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  }));

  return success({
    transactions: formattedTransactions,
    total: data.total,
  });
}
