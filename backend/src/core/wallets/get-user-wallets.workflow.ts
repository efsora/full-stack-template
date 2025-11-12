import { pipe } from "#lib/result/combinators";
import type { Result } from "#lib/result/index";

import type { GetUserWalletsInput } from "./types/inputs";
import type { GetUserWalletsResult } from "./types/outputs";
import {
  findAllUserWallets,
  validateGetUserWallets,
} from "./get-wallet.operations";

/**
 * Get All User Wallets Workflow
 *
 * Orchestrates retrieval of all wallets for a user across all coin types.
 *
 * Steps:
 * 1. Validate input (userId)
 * 2. Find all wallets for user
 *
 * @param input - User ID to find wallets for
 * @returns Result containing array of wallet data
 */
export function getUserWallets(
  input: GetUserWalletsInput,
): Result<GetUserWalletsResult> {
  return pipe(validateGetUserWallets(input), findAllUserWallets);
}
