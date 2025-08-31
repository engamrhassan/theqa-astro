/**
 * Cache Version Management
 * Provides deployment-based cache busting instead of timestamp-based
 */

// Generate version based on build info
function generateCacheVersion() {
  // Try to read build info generated at build time
  if (typeof process === 'undefined') {
    // Browser environment - try to get from window or use fallback
    if (typeof window !== 'undefined' && window.BUILD_INFO) {
      return window.BUILD_INFO.cacheVersion;
    }
    // Browser fallback
    const buildDate = new Date().toISOString().split('T')[0];
    return `v1-${buildDate}`;
  }
  
  // Node.js environment - use synchronous operations
  // Use environment variable if available (set by CI/CD or build script)
  if (process.env.CACHE_VERSION) {
    return process.env.CACHE_VERSION;
  }
  
  // Try to read build info file synchronously
  try {
    const fs = require('fs');
    const path = require('path');
    const buildInfoPath = path.resolve(process.cwd(), 'src/build-info.json');
    
    if (fs.existsSync(buildInfoPath)) {
      const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
      return buildInfo.cacheVersion;
    }
  } catch (error) {
    console.warn('Could not read build-info.json, falling back to package.json');
  }
  
  // Use package.json version + simplified timestamp for local builds
  try {
    const pkg = require('../../package.json');
    const buildDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const buildHour = new Date().getHours(); // 0-23
    return `${pkg.version}-${buildDate}-${buildHour}`;
  } catch (error) {
    console.warn('Could not read package.json for cache version');
    // Final fallback
    const buildDate = new Date().toISOString().split('T')[0];
    return `v1-${buildDate}`;
  }
}

// Cache version for this build
export const CACHE_VERSION = generateCacheVersion();

// Different cache strategies
export const CacheStrategy = {
  // For content that changes with deployments
  DEPLOYMENT: () => `?v=${CACHE_VERSION}`,
  
  // For content that changes daily (like rates, news)
  DAILY: () => {
    const today = new Date().toISOString().split('T')[0];
    return `?v=${CACHE_VERSION}&d=${today}`;
  },
  
  // For content that changes hourly (like live data)
  HOURLY: () => {
    const now = new Date();
    const hourly = `${now.toISOString().split('T')[0]}-${now.getHours()}`;
    return `?v=${CACHE_VERSION}&h=${hourly}`;
  },
  
  // For user-specific content (should not be cached)
  USER_SPECIFIC: () => {
    const userSession = Math.random().toString(36).substring(2, 8);
    return `?v=${CACHE_VERSION}&u=${userSession}`;
  },
  
  // For development (always fresh)
  DEV: () => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      return `?t=${Date.now()}`;
    }
    return CacheStrategy.DEPLOYMENT();
  }
};

// Content-specific cache strategies
export const ContentCache = {
  // Static page content (changes with deployments only)
  PAGE_CONTENT: CacheStrategy.DEPLOYMENT,
  
  // Broker reviews (might change daily)
  BROKER_REVIEWS: CacheStrategy.DAILY,
  
  // Live rates or frequently updating data
  LIVE_DATA: CacheStrategy.HOURLY,
  
  // User-specific data
  USER_DATA: CacheStrategy.USER_SPECIFIC
};

// Helper to get appropriate cache buster for content type
export function getCacheBuster(contentType = 'page') {
  const strategies = {
    'page': ContentCache.PAGE_CONTENT,
    'reviews': ContentCache.BROKER_REVIEWS,
    'live': ContentCache.LIVE_DATA,
    'user': ContentCache.USER_DATA
  };
  
  const strategy = strategies[contentType] || ContentCache.PAGE_CONTENT;
  return strategy();
}

// Debug information
export function getCacheInfo() {
  return {
    version: CACHE_VERSION,
    buildTime: new Date().toISOString(),
    strategies: Object.keys(ContentCache),
    example: {
      page: getCacheBuster('page'),
      reviews: getCacheBuster('reviews'),
      live: getCacheBuster('live')
    }
  };
}