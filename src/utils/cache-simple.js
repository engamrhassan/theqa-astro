/**
 * Simple Cache Utility - Emergency Fallback
 * No complex cache versioning - just basic cache busting when needed
 */

// Simple cache strategies without file system operations
export const getCacheBuster = (type = 'page') => {
  // For development, use timestamp
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'development'
  ) {
    return `?t=${Date.now()}`;
  }

  // For production, use simple date-based versioning
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

  switch (type) {
    case 'page':
      // Changes daily
      return `?v=${dateStr}`;
    case 'reviews':
      // Changes daily
      return `?v=${dateStr}`;
    case 'live':
      // Changes hourly
      return `?v=${dateStr}-${date.getHours()}`;
    case 'user':
      // No cache
      return `?t=${Date.now()}`;
    default:
      return `?v=${dateStr}`;
  }
};

// Minimal cache info
export const getCacheInfo = () => ({
  version: `simple-${new Date().toISOString().split('T')[0]}`,
  type: 'simple',
  buildTime: new Date().toISOString(),
});
