/**
 * AI Service Configuration
 *
 * Configuration for communicating with the AI service (FastAPI).
 */

import { env } from "#infrastructure/config/env";

export const AI_SERVICE_CONFIG = {
  baseURL: env.AI_SERVICE_URL || "http://localhost:8000",
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
    // Add API key header if needed in the future
    // "X-API-Key": env.AI_SERVICE_API_KEY,
  },
} as const;
