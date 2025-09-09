import { z } from 'zod';

/**
 * Broker data validation schema
 */
export const BrokerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  rating: z.number().min(0).max(5),
  min_deposit: z.number().int().min(0),
  license: z.string().min(1).max(50).optional(),
  country_codes: z.array(z.string().length(2)).optional(),
  is_restricted: z.boolean().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Country sorting validation schema
 */
export const CountrySortingSchema = z.object({
  country_code: z.string().length(2),
  broker_id: z.number().int().positive(),
  sort_order: z.number().int().min(0),
  is_restricted: z.boolean().optional(),
});

/**
 * API response validation schema
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

/**
 * Cache metrics validation schema
 */
export const CacheMetricsSchema = z.object({
  hits: z.number().int().min(0),
  misses: z.number().int().min(0),
  errors: z.number().int().min(0),
  countries: z.record(z.string(), z.number().int().min(0)),
  routes: z.record(z.string(), z.number().int().min(0)),
  timestamp: z.string().datetime(),
});

/**
 * Health check response schema
 */
export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'warning', 'critical']),
  hitRate: z.string().regex(/^\d+\.?\d*%$/),
  totalRequests: z.number().int().min(0),
  topCountries: z.array(z.tuple([z.string(), z.number().int().min(0)])),
  topRoutes: z.array(z.tuple([z.string(), z.number().int().min(0)])),
  recommendations: z.array(z.string()),
  timestamp: z.string().datetime(),
});

// Type exports
export type Broker = z.infer<typeof BrokerSchema>;
export type CountrySorting = z.infer<typeof CountrySortingSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type CacheMetrics = z.infer<typeof CacheMetricsSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;
