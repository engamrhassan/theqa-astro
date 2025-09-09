import { describe, it, expect } from 'vitest';
import {
  checkRateLimit,
  isBlocked,
  isValidOrigin,
} from '../utils/security/rate-limit';
import {
  applySecurityHeaders,
  getCorsHeaders,
} from '../utils/security/headers';

describe('Rate Limiting', () => {
  it('should allow requests within limit', () => {
    const result = checkRateLimit('test-ip-1', 'public');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('should block requests over limit', () => {
    const identifier = 'test-ip-2';

    // Make many requests to exceed limit
    for (let i = 0; i < 101; i++) {
      checkRateLimit(identifier, 'public');
    }

    const result = checkRateLimit(identifier, 'public');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should validate origins', () => {
    expect(isValidOrigin('https://astro.theqalink.com')).toBe(true);
    expect(isValidOrigin('https://theqalink.com')).toBe(true);
    expect(isValidOrigin('http://localhost:3000')).toBe(true);
    expect(isValidOrigin('https://malicious.com')).toBe(false);
  });

  it('should check if IP is blocked', () => {
    expect(isBlocked('127.0.0.1')).toBe(false);
    expect(isBlocked('192.168.1.1')).toBe(false);
  });
});

describe('Security Headers', () => {
  it('should apply security headers', () => {
    const response = new Response('test', {
      headers: { 'Content-Type': 'text/html' },
    });

    const securedResponse = applySecurityHeaders(response);
    const headers = securedResponse.headers;

    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('X-XSS-Protection')).toBe('1; mode=block');
    expect(headers.get('Strict-Transport-Security')).toContain(
      'max-age=31536000'
    );
  });

  it('should generate CORS headers', () => {
    const corsHeaders = getCorsHeaders('https://astro.theqalink.com');

    expect(corsHeaders['Access-Control-Allow-Origin']).toBe(
      'https://astro.theqalink.com'
    );
    expect(corsHeaders['Access-Control-Allow-Methods']).toContain('GET');
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain(
      'Content-Type'
    );
  });
});
