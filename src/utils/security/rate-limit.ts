/**
 * Simple in-memory rate limiter
 * In production, use Redis or similar for distributed rate limiting
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private cleanupInterval: number;

  constructor() {
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Check if request is within rate limit
   */
  isAllowed(
    key: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    const requests = this.requests.get(key) || [];

    // Filter requests within the window
    const recentRequests = requests.filter(time => time > windowStart);

    // Check if under limit
    const allowed = recentRequests.length < limit;

    if (allowed) {
      // Add current request
      recentRequests.push(now);
      this.requests.set(key, recentRequests);
    }

    return {
      allowed,
      remaining: Math.max(0, limit - recentRequests.length),
      resetTime: now + windowMs,
    };
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < maxAge);

      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware
 */
export function checkRateLimit(
  identifier: string,
  type: 'public' | 'admin' | 'purge' = 'public'
): { allowed: boolean; remaining: number; resetTime: number } {
  const limits = {
    public: { requests: 100, window: 60 * 1000 },
    admin: { requests: 30, window: 60 * 1000 },
    purge: { requests: 10, window: 60 * 60 * 1000 },
  };

  const limit = limits[type];
  return rateLimiter.isAllowed(identifier, limit.requests, limit.window);
}

/**
 * Generate rate limit headers
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
  };
}

/**
 * Check if IP is blocked (simple implementation)
 */
export function isBlocked(ip: string): boolean {
  // In production, implement proper IP blocking logic
  // This is a placeholder
  const blockedIPs = new Set<string>();
  return blockedIPs.has(ip);
}

/**
 * Validate request origin
 */
export function isValidOrigin(origin: string): boolean {
  const allowedOrigins = [
    'https://astro.theqalink.com',
    'https://theqalink.com',
    'http://localhost:3000',
    'http://localhost:4321',
  ];

  return allowedOrigins.includes(origin);
}
