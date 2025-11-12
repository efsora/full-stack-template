import { matchResponse } from "#lib/result/combinators";
import { run } from "#lib/result/index";
import { transferCoins, getTransactionHistory } from "#core/transactions/index";
import {
  createFailureResponse,
  createSuccessResponse,
  createPaginatedSuccessResponse,
  type AppResponse,
} from "#lib/types/response";
import type { ValidatedRequest } from "#middlewares/validate";

import type {
  TransferCoinsBody,
  GetTransactionHistoryParams,
  GetTransactionHistoryQuery,
} from "./schemas";
import type {
  TransferCoinsResult,
  GetTransactionHistoryResult,
} from "#core/transactions/index";

/**
 * POST /transactions/transfer
 * Transfer coins between users
 */
export async function handleTransferCoins(
  req: ValidatedRequest<{ body: TransferCoinsBody }>,
): Promise<AppResponse<TransferCoinsResult>> {
  const body = req.validated.body;
  const result = await run(
    transferCoins({
      amount: body.amount,
      coinType: body.coinType,
      fromUserId: body.fromUserId,
      toUserId: body.toUserId,
    }),
  );

  return matchResponse(result, {
    onSuccess: (data) =>
      createSuccessResponse({
        transaction: {
          id: data.transaction.id,
          fromWalletId: data.transaction.fromWalletId,
          toWalletId: data.transaction.toWalletId,
          amount: data.transaction.amount,
          coinType: data.transaction.coinType,
          status: data.transaction.status,
          createdAt: data.transaction.createdAt,
          updatedAt: data.transaction.updatedAt,
        },
        fromWalletBalance: data.fromWalletBalance,
        toWalletBalance: data.toWalletBalance,
      }),
    onFailure: (error) => createFailureResponse(error),
  });
}

/**
 * GET /transactions/:userId
 * Get transaction history for a user
 *
 * Retrieves all transactions where the user is either sender or receiver,
 * across all their wallets. Results are paginated and sorted by creation date (newest first).
 */
export async function handleGetTransactionHistory(
  req: ValidatedRequest<{
    params: GetTransactionHistoryParams;
    query: GetTransactionHistoryQuery;
  }>,
): Promise<AppResponse<GetTransactionHistoryResult>> {
  const { userId } = req.validated.params;
  const { limit, offset } = req.validated.query;

  const result = await run(
    getTransactionHistory({
      userId,
      limit,
      offset,
    }),
  );

  return matchResponse(result, {
    onSuccess: (data) => {
      // Convert offset/limit to page-based pagination for response
      const actualLimit = limit ?? 10;
      const actualOffset = offset ?? 0;
      const page = Math.floor(actualOffset / actualLimit) + 1;

      return createPaginatedSuccessResponse({
        data: {
          transactions: data.transactions,
          total: data.total,
        },
        pagination: {
          page,
          size: actualLimit,
          total: data.total,
        },
      });
    },
    onFailure: (error) => createFailureResponse(error),
  });
}
