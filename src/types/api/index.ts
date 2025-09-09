/**
 * API Response Types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Pagination Types
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Error Types
 */
export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
}

/**
 * Request Configuration
 */
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

/**
 * Cache Configuration
 */
export interface CacheConfig {
  ttl?: number;
  key?: string;
  strategy?: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
}
