import { matchResponse } from "#lib/effect/combinators";
import { success } from "#lib/effect/factories";
import { runEffect } from "#lib/effect/index";

/**
 * GET /hello
 * Simple health/test endpoint
 */
export async function handleGetHello() {
  const result = await runEffect(
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