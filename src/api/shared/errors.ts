/**
 * Custom API Error Classes
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error Handler
 */
export class ErrorHandler {
  /**
   * Handle API errors
   */
  static handleAPIError(error: unknown): never {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof NetworkError) {
      throw new APIError('Network error', 0, 'NETWORK_ERROR');
    }

    if (error instanceof TimeoutError) {
      throw new APIError('Request timeout', 408, 'TIMEOUT_ERROR');
    }

    if (error instanceof ValidationError) {
      throw new APIError(
        `Validation error: ${error.message}`,
        400,
        'VALIDATION_ERROR',
        { field: error.field, value: error.value }
      );
    }

    // Handle fetch errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new TimeoutError('Request was aborted');
      }

      if (error.message.includes('fetch')) {
        throw new NetworkError('Network request failed');
      }
    }

    throw new APIError('Unknown error', 500, 'UNKNOWN_ERROR');
  }

  /**
   * Create user-friendly error messages
   */
  static getUserFriendlyMessage(error: APIError): string {
    const errorMessages: Record<string, string> = {
      NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
      TIMEOUT_ERROR: 'The request took too long to complete. Please try again.',
      VALIDATION_ERROR: 'The data you provided is invalid. Please check your input.',
      NOT_FOUND: 'The requested resource was not found.',
      UNAUTHORIZED: 'You are not authorized to access this resource.',
      FORBIDDEN: 'Access to this resource is forbidden.',
      RATE_LIMITED: 'Too many requests. Please wait a moment before trying again.',
      SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    };

    return errorMessages[error.code] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Log error for debugging
   */
  static logError(error: APIError, context?: string): void {
    const logData = {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
      context,
      timestamp: new Date().toISOString(),
    };

    // In production, this would be sent to a logging service
    // eslint-disable-next-line no-console
    console.error('API Error:', logData);
  }
}
