/**
 * AI Demo Handlers
 *
 * Example handlers demonstrating type-safe communication with AI service.
 */

import type { Request, Response } from "express";
import { aiServiceClient } from "#infrastructure/ai-service";
import { logger } from "#infrastructure/logger";

/**
 * Test AI service hello endpoint
 */
export async function handleAIHello(req: Request, res: Response) {
  try {
    // Type-safe call to AI service
    const response = await aiServiceClient.hello();

    return res.json({
      success: true,
      data: response.data,
      message: "Successfully called AI service",
      ai_trace_id: response.trace_id,
    });
  } catch (error) {
    logger.error({ error }, "Failed to call AI service");
    return res.status(500).json({
      success: false,
      error: "Failed to communicate with AI service",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Embed text using AI service
 */
export async function handleEmbedText(req: Request, res: Response) {
  try {
    const { text, collection } = req.body;

    if (!text || !collection) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: text and collection",
      });
    }

    // Type-safe call to AI service embed endpoint
    const response = await aiServiceClient.embedText({
      text,
      collection,
    });

    return res.json({
      success: true,
      data: response.data,
      message: "Text embedded successfully",
      ai_trace_id: response.trace_id,
    });
  } catch (error) {
    logger.error({ error }, "Failed to embed text");
    return res.status(500).json({
      success: false,
      error: "Failed to embed text",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Search Weaviate using AI service
 */
export async function handleSearch(req: Request, res: Response) {
  try {
    const { query, collection, limit = 10 } = req.body;

    if (!query || !collection) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: query and collection",
      });
    }

    // Type-safe call to AI service search endpoint
    const response = await aiServiceClient.search({
      query,
      collection,
      limit,
    });

    return res.json({
      success: true,
      data: response.data,
      message: `Found ${response.data?.count || 0} results`,
      ai_trace_id: response.trace_id,
    });
  } catch (error) {
    logger.error({ error }, "Failed to search");
    return res.status(500).json({
      success: false,
      error: "Failed to search",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
