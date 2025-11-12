import { matchResponse } from "#lib/result/combinators";
import { run } from "#lib/result/index";
import {
  createWallet,
  getWallet,
  getUserWallets,
} from "#core/wallets/index";
import {
  createFailureResponse,
  createSuccessResponse,
  type AppResponse,
} from "#lib/types/response";
import type { ValidatedRequest } from "#middlewares/validate";

import type {
  CreateWalletBody,
  GetWalletParams,
  GetUserWalletsParams,
} from "./schemas";
import type {
  CreateWalletResult,
  GetWalletResult,
  GetUserWalletsResult,
} from "#core/wallets/index";

/**
 * POST /wallets
 * Create a new wallet for a user
 */
export async function handleCreateWallet(
  req: ValidatedRequest<{ body: CreateWalletBody }>,
): Promise<AppResponse<CreateWalletResult>> {
  const body = req.validated.body;
  const result = await run(createWallet(body));

  return matchResponse(result, {
    onSuccess: (wallet) =>
      createSuccessResponse({
        id: wallet.id,
        userId: wallet.userId,
        balance: wallet.balance,
        coinType: wallet.coinType,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      }),
    onFailure: (error) => createFailureResponse(error),
  });
}

/**
 * GET /wallets/:userId/:coinType
 * Get a specific wallet by user ID and coin type
 */
export async function handleGetWallet(
  req: ValidatedRequest<{ params: GetWalletParams }>,
): Promise<AppResponse<GetWalletResult>> {
  const { userId, coinType } = req.validated.params;

  const result = await run(getWallet({ userId, coinType }));

  return matchResponse(result, {
    onSuccess: (wallet) =>
      createSuccessResponse({
        id: wallet.id,
        userId: wallet.userId,
        balance: wallet.balance,
        coinType: wallet.coinType,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      }),
    onFailure: (error) => createFailureResponse(error),
  });
}

/**
 * GET /wallets/:userId
 * Get all wallets for a user
 */
export async function handleGetUserWallets(
  req: ValidatedRequest<{ params: GetUserWalletsParams }>,
): Promise<AppResponse<GetUserWalletsResult>> {
  const { userId } = req.validated.params;

  const result = await run(getUserWallets({ userId }));

  return matchResponse(result, {
    onSuccess: (wallets) =>
      createSuccessResponse(
        wallets.map((wallet) => ({
          id: wallet.id,
          userId: wallet.userId,
          balance: wallet.balance,
          coinType: wallet.coinType,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
        })),
      ),
    onFailure: (error) => createFailureResponse(error),
  });
}
