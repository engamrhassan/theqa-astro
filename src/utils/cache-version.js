/**
 * Cache Version Management - Optimized for Performance
 * Provides deployment-based cache busting instead of timestamp-based
 */

// Cached version to avoid repeated file system operations
let cachedVersion = null;
let lastCheckTime = 0;
const CACHE_TTL = 60000; // Cache version for 1 minute to avoid repeated FS operations

// Generate version based on build info (optimized with caching)
function generateCacheVersion() {
  // Return cached version if still valid
  const now = Date.now();
  if (cachedVersion && (now - lastCheckTime) < CACHE_TTL) {
    return cachedVersion;
  }
  
  // Browser environment - use simple fallback
  if (typeof process === 'undefined') {
    if (typeof window !== 'undefined' && window.BUILD_INFO) {
      cachedVersion = window.BUILD_INFO.cacheVersion;
    } else {
      // Fast browser fallback - use current date only
      const buildDate = new Date().toISOString().split('T')[0];
      cachedVersion = `v1-${buildDate}`;
    }
    lastCheckTime = now;
    return cachedVersion;
  }
  
  // Fast path: Use environment variable if available
  if (process.env.CACHE_VERSION) {
    cachedVersion = process.env.CACHE_VERSION;
    lastCheckTime = now;
    return cachedVersion;
  }
  
  // Try to read build info file only once per minute
  try {
    const fs = require('fs');
    const path = require('path');
    const buildInfoPath = path.resolve(process.cwd(), 'src/build-info.json');
    
    if (fs.existsSync(buildInfoPath)) {
      const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
      cachedVersion = buildInfo.cacheVersion;
      lastCheckTime = now;
      return cachedVersion;
    }
  } catch (error) {
    // Silent fallback - avoid console.warn during production builds
  }
  
  // Fast fallback without package.json read
  const buildDate = new Date().toISOString().split('T')[0];
  const buildHour = new Date().getHours();
  cachedVersion = `v1-${buildDate}-${buildHour}`;
  lastCheckTime = now;
  return cachedVersion;
}

// Lazy initialization - only generate when needed
let _cacheVersion = null;
export function getCacheVersion() {
  if (_cacheVersion === null) {
    _cacheVersion = generateCacheVersion();
  }
  return _cacheVersion;
}

// Export as constant (computed once)
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