/**
 * Standard response formatters for API responses
 */

import type { PaginationMeta } from "#shared/types/pagination.js";

export interface ErrorResponse {
  code: string;
  details?: unknown;
  message: string;
  status: "error";
}

export interface PaginatedSuccessResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  status: "success";
}

export interface SuccessResponse<T> {
  data: T;
  status: "success";
}

/**
 * Calculates pagination metadata from query parameters and total count
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    limit,
    page,
    total,
    totalPages,
  };
}

/**
 * Creates a standard error response
 */
export function errorResponse(message: string, code: string, details?: unknown): ErrorResponse {
  const response: ErrorResponse = {
    code,
    message,
    status: "error",
  };

  if (details !== undefined) {
    response.details = details;
  }

  return response;
}

/**
 * Creates a paginated success response with metadata
 */
export function paginatedSuccessResponse<T>(
  data: T[],
  pagination: PaginationMeta,
): PaginatedSuccessResponse<T> {
  return {
    data,
    pagination,
    status: "success",
  };
}

/**
 * Creates a standard success response
 */
export function successResponse<T>(data: T): SuccessResponse<T> {
  return {
    data,
    status: "success",
  };
}