import { run } from "#lib/result/index";
import { matchResponse } from "#lib/result/combinators";
import { getSupportedCurrencies } from "#core/currencies/index";
import {
  createSuccessResponse,
  createFailureResponse,
  type AppResponse,
} from "#lib/types/response";
import type { GetCurrenciesResult } from "#core/currencies/index";

/**
 * Get supported currencies handler
 */
export async function handleGetSupportedCurrencies(): Promise<
  AppResponse<GetCurrenciesResult>
> {
  const result = await run(getSupportedCurrencies());

  return matchResponse(result, {
    onSuccess: (data) => createSuccessResponse(data),
    onFailure: (error) => createFailureResponse(error),
  });
}
