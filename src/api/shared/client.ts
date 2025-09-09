import type { ApiResponse, RequestConfig, ApiError } from '../../types/api';

/**
 * HTTP Client for API requests
 */
export class HttpClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;

  constructor(
    baseURL: string,
    options: {
      timeout?: number;
      retries?: number;
      retryDelay?: number;
    } = {}
  ) {
    this.baseURL = baseURL;
    this.defaultTimeout = options.timeout || 5000;
    this.defaultRetries = options.retries || 3;
    this.defaultRetryDelay = options.retryDelay || 1000;
  }

  /**
   * Make HTTP request with retry logic
   */
  async request<T>(
    endpoint: string,
    options: RequestInit & RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...fetchOptions
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.shouldNotRetry(error as Error)) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await this.delay(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    return this.createErrorResponse(lastError || new Error('Unknown error'));
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...config,
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...config,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...config,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...config,
    });
  }

  /**
   * Check if error should not be retried
   */
  private shouldNotRetry(error: Error): boolean {
    // Don't retry on 4xx errors (client errors)
    if (error.message.includes('HTTP 4')) {
      return true;
    }

    // Don't retry on abort errors
    if (error.name === 'AbortError') {
      return true;
    }

    return false;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: Error): ApiResponse {
    return {
      success: false,
      error: error.message,
      message: 'Request failed',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Default API client instance
 */
export const apiClient = new HttpClient('https://api.theqalink.com', {
  timeout: 5000,
  retries: 3,
  retryDelay: 1000,
});
