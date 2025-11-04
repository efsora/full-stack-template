/**
 * AI Service HTTP Client
 *
 * Type-safe HTTP client for communicating with the AI service (FastAPI).
 * Uses generated types from OpenAPI spec for full type safety.
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { paths, components } from "#generated/ai-service";
import { logger } from "#infrastructure/logger";
import { AI_SERVICE_CONFIG } from "./config.js";

/**
 * Type-safe response type from AI service
 */
export type AIServiceResponse<T> = {
  success: boolean;
  data?: T | null;
  message?: string | null;
  meta?: components["schemas"]["Meta"] | null;
  error?: components["schemas"]["ErrorInfo"] | null;
  trace_id?: string | null;
};

/**
 * AI Service Client
 * Provides type-safe methods for calling AI service endpoints
 */
export class AIServiceClient {
  private client: AxiosInstance;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || AI_SERVICE_CONFIG.baseURL,
      timeout: AI_SERVICE_CONFIG.timeout,
      headers: AI_SERVICE_CONFIG.headers,
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(
          {
            method: config.method,
            url: config.url,
            baseURL: config.baseURL,
          },
          "AI Service request",
        );
        return config;
      },
      (error) => {
        logger.error({ error }, "AI Service request error");
        return Promise.reject(error);
      },
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(
          {
            status: response.status,
            url: response.config.url,
            traceId: response.data?.trace_id,
          },
          "AI Service response",
        );
        return response;
      },
      (error) => {
        logger.error(
          {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message,
            data: error.response?.data,
          },
          "AI Service response error",
        );
        return Promise.reject(error);
      },
    );
  }

  /**
   * Health check endpoint
   */
  async hello(): Promise<
    AIServiceResponse<components["schemas"]["HelloResponse"]>
  > {
    const response =
      await this.client.get<
        paths["/api/v1/hello"]["get"]["responses"][200]["content"]["application/json"]
      >("/api/v1/hello");
    return response.data;
  }

  /**
   * Create user in AI service
   */
  async createUser(
    data: components["schemas"]["CreateUserRequest"],
  ): Promise<
    AIServiceResponse<components["schemas"]["CreateUserResponse"]>
  > {
    const response =
      await this.client.post<
        paths["/api/v1/users"]["post"]["responses"][201]["content"]["application/json"]
      >("/api/v1/users", data);
    return response.data;
  }

  /**
   * Embed text into Weaviate
   */
  async embedText(
    data: components["schemas"]["EmbedRequest"],
  ): Promise<AIServiceResponse<components["schemas"]["EmbedResponse"]>> {
    const response =
      await this.client.post<
        paths["/api/v1/weaviate/embed"]["post"]["responses"][201]["content"]["application/json"]
      >("/api/v1/weaviate/embed", data);
    return response.data;
  }

  /**
   * Search Weaviate
   */
  async search(
    data: components["schemas"]["SearchRequest"],
  ): Promise<AIServiceResponse<components["schemas"]["SearchResponse"]>> {
    const response =
      await this.client.post<
        paths["/api/v1/weaviate/search"]["post"]["responses"][200]["content"]["application/json"]
      >("/api/v1/weaviate/search", data);
    return response.data;
  }

  /**
   * Generic request method for custom requests
   */
  async request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }
}

/**
 * Singleton instance of AI Service Client
 */
export const aiServiceClient = new AIServiceClient();

/**
 * Factory function for creating AI Service Client with custom config
 */
export function createAIServiceClient(baseURL?: string): AIServiceClient {
  return new AIServiceClient(baseURL);
}
