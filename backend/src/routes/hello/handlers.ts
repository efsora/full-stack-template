import type { HelloResponse } from "./schemas.js";

/**
 * GET /hello
 * Simple health/test endpoint
 */
export async function handleGetHello() {
  const response: HelloResponse = {
    message: "Hello from API",
  };

  return response;
}
