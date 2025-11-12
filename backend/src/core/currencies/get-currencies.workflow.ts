import { pipe } from "#lib/result/combinators";
import type { Result } from "#lib/result/index";
import { success } from "#lib/result/index";
import type { GetCurrenciesResult } from "./types/outputs";
import { findAllActiveCurrencies } from "./get-currencies.operations";

/**
 * Get Supported Currencies Workflow
 *
 * Orchestrates retrieval of all active currencies.
 * These currencies define the coin types available for wallets and transactions.
 *
 * Steps:
 * 1. Find all active currencies
 * 2. Format and return as GetCurrenciesResult
 *
 * @returns Result containing array of available currencies
 */
export function getSupportedCurrencies(): Result<GetCurrenciesResult> {
  return pipe(
    findAllActiveCurrencies(),
    (currencies): Result<GetCurrenciesResult> => success({ currencies }),
  );
}
