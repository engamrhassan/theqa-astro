import { z } from 'zod';

/**
 * Generic validation utility with error handling
 */
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
 * Safe validation function that returns a result object
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const validationError = new ValidationError(
        firstError.message,
        firstError.path.join('.'),
        data
      );
      return { success: false, error: validationError };
    }

    const validationError = new ValidationError(
      'Unknown validation error',
      'unknown',
      data
    );
    return { success: false, error: validationError };
  }
}

/**
 * Validate and throw on error
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = safeValidate(schema, data);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

/**
 * Validate API request data
 */
export function validateApiRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string = 'API request'
): T {
  try {
    return validate(schema, data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Validation failed for ${context}:`, error);
    throw new Error(`Invalid ${context} data: ${error.message}`);
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsedUrl.toString();
  } catch {
    throw new ValidationError('Invalid URL format', 'url', url);
  }
}

/**
 * Validate country code
 */
export function validateCountryCode(code: string): string {
  const countryCodeRegex = /^[A-Z]{2}$/;
  if (!countryCodeRegex.test(code)) {
    throw new ValidationError(
      'Invalid country code format',
      'countryCode',
      code
    );
  }
  return code.toUpperCase();
}
