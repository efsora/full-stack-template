import { pipe } from "#lib/result/combinators";
import type { Result } from "#lib/result/index";

import type { GetTransactionHistoryInput } from "./types/inputs";
import type { GetTransactionHistoryResult } from "./types/outputs";
import {
  validateGetTransactionHistory,
  findUserWallets,
  findTransactionsForWallets,
  formatTransactionHistory,
} from "./get-transaction-history.operations";

/**
 * Get Transaction History Workflow
 *
 * Orchestrates retrieval of transaction history for a user with pagination.
 * Finds all transactions where the user is either sender or receiver across all their wallets.
 *
 * FCIS Principle: This is pure orchestration in the Functional Core.
 * All side effects are wrapped in command() within operations.
 * Uses railway-oriented programming with pipe() for automatic error handling.
 *
 * Steps:
 * 1. Validate input (userId, limit, offset) and set defaults
 * 2. Find all wallets belonging to the user
 * 3. Find transactions for all wallets with pagination
 * 4. Format results into API response format
 *
 * @param input - Transaction history request (userId, limit, offset)
 * @returns Result containing paginated transactions and total count
 *
 * @example
 * ```typescript
 * const result = await run(
 *   getTransactionHistory({
 *     userId: "user-123",
 *     limit: 20,
 *     offset: 0
 *   })
 * );
 * ```
 */
export function getTransactionHistory(
  input: GetTransactionHistoryInput,
): Result<GetTransactionHistoryResult> {
  return pipe(
    validateGetTransactionHistory(input),
    findUserWallets,
    findTransactionsForWallets,
    formatTransactionHistory,
  );
}
