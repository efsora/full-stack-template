import { matchResponse } from "#lib/result/combinators";
import { success } from "#lib/result/factories";
import { run } from "#lib/result/index";
import {
  createFailureResponse,
  createSuccessResponse,
  type AppResponse,
} from "#lib/types/response";

/**
 * GET /hello
 * Simple health/test endpoint
 */
export async function handleGetHello(): Promise<AppResponse<{
  message: string;
  timestamp: string;
}>> {
  const result = await run(
    success({
      message: "Hello from API",
      timestamp: new Date().toISOString(),
    }),
  );

  // Explicitly map response fields for API contract
  return matchResponse(result, {
    onSuccess: (data) => createSuccessResponse({
      message: data.message,
      timestamp: data.timestamp,
    }),
    onFailure: (error) => createFailureResponse(error),
  });
}