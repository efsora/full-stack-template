import { success } from "#lib/effect/factories";
import { runEffect } from "#lib/effect/index";

/**
 * GET /hello
 * Simple health/test endpoint
 */
export async function handleGetHello() {
  return await runEffect(success({
      message: "Hello from API",
      timestamp: new Date().toISOString(),
    }),
  );
}