/**
 * Fast Cache Version Management
 * Optimized for performance - minimal file system operations
 */

// Static cache version - set once at startup
let CACHE_VERSION = null;

// Initialize cache version immediately with minimal overhead
function initCacheVersion() {
  // 1. Try environment variable first (fastest)
  if (typeof process !== 'undefined' && process.env.CACHE_VERSION) {
    return process.env.CACHE_VERSION;
  }
  
  // 2. Browser fallback (fast)
  if (typeof process === 'undefined') {
    return `v1-${new Date().toISOString().split('T')[0]}`;
  }
  
  // 3. Try build info file (one read only)
  try {
    const fs = require('fs');
    const buildInfoPath = 'src/build-info.json';
    if (fs.existsSync(buildInfoPath)) {
      const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
      return buildInfo.cacheVersion;
    }
  } catch (error) {
    // Silent fail - no logging in production
  }
  
  // 4. Fast fallback
  const date = new Date();
  return `v1-${date.toISOString().split('T')[0]}-${date.getHours()}`;
}

// Initialize once
CACHE_VERSION = initCacheVersion();

// Export static version
export { CACHE_VERSION };

// Fast cache strategies (pre-computed strings)
export const getCacheBuster = (type = 'page') => {
  const baseVersion = `?v=${CACHE_VERSION}`;
  
  switch (type) {
    case 'page':
      return baseVersion;
    case 'reviews':
      return `${baseVersion}&d=${new Date().toISOString().split('T')[0]}`;
    case 'live':
      const now = new Date();
      return `${baseVersion}&h=${now.toISOString().split('T')[0]}-${now.getHours()}`;
    case 'user':
      return `${baseVersion}&u=${Math.random().toString(36).substring(2, 8)}`;
    default:
      return baseVersion;
  }
};

// Simple cache info for debugging
export const getCacheInfo = () => ({
  version: CACHE_VERSION,
  buildTime: new Date().toISOString(),
  strategies: ['page', 'reviews', 'live', 'user'],
  example: {
    page: getCacheBuster('page'),
    reviews: getCacheBuster('reviews'),
    live: getCacheBuster('live')
  }
});