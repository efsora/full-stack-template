import { matchResponse } from "#lib/result/combinators";
import { success } from "#lib/result/factories";
import { run } from "#lib/result/index";

/**
 * GET /hello
 * Simple health/test endpoint
 */
export async function handleGetHello() {
  const result = await run(
    success({
      message: "Hello from API",
      timestamp: new Date().toISOString(),
    }),
  );

  // Explicitly map response fields for API contract
  return matchResponse(result, {
    onSuccess: (data) => ({
      message: data.message,
      timestamp: data.timestamp,
    }),
  });
}