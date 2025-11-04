/**
 * AI Demo Routes
 *
 * Example routes demonstrating type-safe AI service integration.
 */

import { Router } from "express";
import { handleAIHello, handleEmbedText, handleSearch } from "./handlers.js";

const router = Router();

/**
 * GET /api/v1/ai-demo/hello
 * Test AI service connection
 */
router.get("/hello", handleAIHello);

/**
 * POST /api/v1/ai-demo/embed
 * Embed text into Weaviate via AI service
 *
 * Body: { text: string, collection: string }
 */
router.post("/embed", handleEmbedText);

/**
 * POST /api/v1/ai-demo/search
 * Search Weaviate via AI service
 *
 * Body: { query: string, collection: string, limit?: number }
 */
router.post("/search", handleSearch);

export default router;
