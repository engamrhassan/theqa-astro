/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.theqalink.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

/**
 * Cache control headers for different content types
 */
export const CACHE_HEADERS = {
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    Vary: 'Accept-Encoding',
  },
  dynamic: {
    'Cache-Control':
      'public, max-age=1800, s-maxage=3600, stale-while-revalidate=300',
    Vary: 'CF-IPCountry, Accept-Encoding',
  },
  noCache: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  },
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  public: {
    requests: 100,
    window: 60, // seconds
    burst: 10,
  },
  admin: {
    requests: 30,
    window: 60, // seconds
    burst: 5,
  },
  purge: {
    requests: 10,
    window: 3600, // 1 hour
    burst: 2,
  },
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  // Apply security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Apply cache headers based on content type
 */
export function applyCacheHeaders(
  response: Response,
  type: keyof typeof CACHE_HEADERS
): Response {
  const headers = new Headers(response.headers);

  // Apply cache headers
  Object.entries(CACHE_HEADERS[type]).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Generate CORS headers
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    'https://astro.theqalink.com',
    'https://theqalink.com',
    'http://localhost:3000',
    'http://localhost:4321',
  ];

  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed
      ? origin
      : 'https://astro.theqalink.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}
