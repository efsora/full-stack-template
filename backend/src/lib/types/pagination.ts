/**
 * Pagination Types
 * Global type definitions for pagination support across all domains
 */

/**
 * Generic paginated response wrapper
 * Used to wrap any data type with pagination metadata
 */
export type PaginatedResponse<T> = {
  /** Array of items for current page */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
};

/**
 * Pagination metadata included in responses
 */
export type PaginationMeta = {
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
  /** Number of items per page */
  limit: number;
  /** Current page number */
  page: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  totalPages: number;
};

/**
 * Pagination query parameters
 */
export type PaginationParams = {
  /** Number of items per page */
  limit: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: SortOrder;
};

/**
 * Sort order for pagination queries
 */
export type SortOrder = "asc" | "desc";
