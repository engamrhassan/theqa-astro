# TheQA Astro - Cache Management Manual

## 📖 Table of Contents

1. [Quick Reference](#quick-reference)
2. [Cache System Overview](#cache-system-overview)
3. [Cache Strategies](#cache-strategies)
4. [Daily Operations](#daily-operations)
5. [Monitoring & Analytics](#monitoring--analytics)
6. [Troubleshooting](#troubleshooting)
7. [Emergency Procedures](#emergency-procedures)
8. [Advanced Configuration](#advanced-configuration)
9. [Best Practices](#best-practices)

---

## 🚀 Quick Reference

### Essential Commands
```bash
# Build with cache versioning
npm run build

# Test cache system
node test-cache-version.js

# Clear all caches manually
node clear-cache.js

# Generate build info only
node _build-info.js

# Simple build (no cache versioning)
npm run build:simple
```

### Current Cache Version
```bash
# Check current version
cat src/build-info.json

# View cache info programmatically
node -e "import('./src/utils/cache-version.js').then(m => console.log(m.getCacheInfo()))"
```

### Emergency Cache Clear
```bash
# 1. Clear Cloudflare cache
node clear-cache.js

# 2. Force new deployment
git commit --allow-empty -m "Force cache refresh" && git push

# 3. Manual CF cache purge (if needed)
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

## 🏗️ Cache System Overview

### Architecture Layers

```
┌─────────────────────┐
│   User Request      │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Cloudflare Edge     │ ← 1 hour cache
│ Cache (Geographic)  │   Varies by country
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Astro Static Pages  │ ← Build-time cache
│ (Pre-generated)     │   Until deployment
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ API Calls with      │ ← Version-based cache
│ Cache Busting       │   Strategy-dependent
└─────────────────────┘
```

### Cache Version Format
```
Format: {package.version}-{git.hash}
Example: 0.0.1-3eee179

Fallback: {package.version}-{date}-{hour}
Example: 0.0.1-2025-08-31-16
```

---

## 🎯 Cache Strategies

### 1. Deployment Cache (DEFAULT)
```javascript
getCacheBuster('page')
// Output: ?v=0.0.1-3eee179
```
- **Duration**: Until next deployment
- **Use for**: Static content, page templates, layouts
- **Cache hits**: 99%+ between deployments
- **Best for**: Content that changes with code releases

### 2. Daily Cache
```javascript
getCacheBuster('reviews')
// Output: ?v=0.0.1-3eee179&d=2025-08-31
```
- **Duration**: 24 hours
- **Use for**: Broker reviews, daily reports, news
- **Cache hits**: ~95% during the day
- **Best for**: Content updated daily

### 3. Hourly Cache
```javascript
getCacheBuster('live')
// Output: ?v=0.0.1-3eee179&h=2025-08-31-16
```
- **Duration**: 1 hour
- **Use for**: Live rates, real-time data, trending content
- **Cache hits**: ~80% during peak hours
- **Best for**: Frequently changing data

### 4. User-Specific (No Cache)
```javascript
getCacheBuster('user')
// Output: ?v=0.0.1-3eee179&u=abc123
```
- **Duration**: No caching
- **Use for**: Personal dashboards, user settings
- **Cache hits**: 0% (intentional)
- **Best for**: Personalized content

### 5. Development Mode
```javascript
// Automatically used in development
getCacheBuster('dev')
// Output: ?t=1693478400000 (timestamp)
```
- **Duration**: No caching
- **Use for**: Development and testing
- **Activation**: `NODE_ENV=development`

---

## 📅 Daily Operations

### Morning Checklist
```bash
# 1. Check cache status
node test-cache-version.js

# 2. Review build info
cat src/build-info.json

# 3. Check for cache errors in logs
grep -i "cache" logs/*.log

# 4. Monitor cache hit rates (if available)
# Check Cloudflare Analytics → Caching
```

### Content Updates
```bash
# For immediate content updates (emergency)
# 1. Clear caches first
node clear-cache.js

# 2. Update content
# Edit your content files...

# 3. Deploy immediately
git add . && git commit -m "Urgent content update" && git push

# 4. Verify cache version changed
# Wait 2-3 minutes, then check:
curl -I https://astro.theqalink.com/ | grep -i cache
```

### Scheduled Maintenance
```bash
# Weekly cache optimization
# 1. Review cache hit rates
# 2. Check for orphaned cache entries
# 3. Update cache strategies if needed
# 4. Test cache invalidation
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

#### 1. Cache Hit Rates
```
Target Metrics:
- Deployment Cache: >95%
- Daily Cache: >90%
- Hourly Cache: >75%
- Overall: >85%
```

#### 2. Response Times
```
Target Response Times:
- Cache Hit: <100ms
- Cache Miss: <500ms
- API Calls: <1000ms
```

#### 3. Cache Version Distribution
```bash
# Check current cache version usage
# Via server logs or analytics tools
# Look for: X-Cache-Version header
```

### Monitoring Commands

#### Check Cache Version in Production
```bash
# Test main pages
curl -I https://astro.theqalink.com/ | grep -i cache
curl -I https://astro.theqalink.com/reviews/ | grep -i cache

# Test specific cache strategies
curl -s "https://theqalink.com/api/v1/page/test$(node -p 'import("./src/utils/cache-version.js").then(m=>m.getCacheBuster("page"))')"
```

#### Performance Testing
```bash
# Test cache performance
for i in {1..10}; do
  time curl -s https://astro.theqalink.com/ > /dev/null
done

# Compare cached vs uncached
time curl -s "https://astro.theqalink.com/?v=test-uncached" > /dev/null
time curl -s "https://astro.theqalink.com/?v=0.0.1-3eee179" > /dev/null
```

### Cloudflare Analytics Dashboard
Navigate to: **Cloudflare Dashboard → Analytics → Performance**

Key sections to monitor:
- **Requests**: Total vs cached
- **Bandwidth**: Saved via caching
- **Cache Hit Ratio**: Should be >80%
- **Edge Response Time**: Should be <100ms

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Cache Not Updating After Deployment
```
Symptoms: Old content still showing
Diagnosis: Cache version not changing

Solutions:
# Check if build info was generated
cat src/build-info.json

# Verify cache version in use
node test-cache-version.js

# Manual cache clear
node clear-cache.js

# Force new deployment
git commit --allow-empty -m "Force refresh" && git push
```

#### 2. Different Content for Different Users
```
Symptoms: Users see different content
Diagnosis: Country-based caching issues

Solutions:
# Check CF Worker logs
# Verify country detection
curl -H "CF-IPCountry: US" https://astro.theqalink.com/

# Test with different countries
curl -H "CF-IPCountry: SA" https://astro.theqalink.com/
curl -H "CF-IPCountry: AE" https://astro.theqalink.com/
```

#### 3. Slow API Responses
```
Symptoms: API calls taking too long
Diagnosis: Cache not working for API calls

Solutions:
# Verify cache buster format
node -e "console.log(require('./src/utils/cache-version.js').getCacheBuster('reviews'))"

# Check API logs for cache headers
# Verify cache strategy is appropriate
```

#### 4. Build Info Not Generated
```
Symptoms: Using fallback cache versions
Diagnosis: Build script issues

Solutions:
# Test build script directly
node scripts/build.js

# Check file permissions
ls -la src/build-info.json

# Verify git is available
git --version

# Check CF Pages environment
echo $CF_PAGES_COMMIT_SHA
```

### Debug Mode

#### Enable Verbose Logging
```javascript
// Add to cache-version.js for debugging
console.log('Debug: Cache version generation');
console.log('Process env:', process.env.CACHE_VERSION);
console.log('Build info exists:', fs.existsSync('src/build-info.json'));
```

#### Test Individual Components
```bash
# Test cache version utility
node -e "console.log(require('./src/utils/cache-version.js').CACHE_VERSION)"

# Test build info generation
node -e "require('./scripts/build.js').generateBuildInfo().then(console.log)"

# Test different strategies
node -e "const c=require('./src/utils/cache-version.js'); console.log({page:c.getCacheBuster('page'),reviews:c.getCacheBuster('reviews')})"
```

---

## 🚨 Emergency Procedures

### Emergency Cache Clear (All Layers)

#### Level 1: Application Cache Clear
```bash
# 1. Clear local build cache
rm -rf dist/ .astro/

# 2. Clear node modules cache
npm ci

# 3. Rebuild with new version
npm run build
```

#### Level 2: CDN Cache Clear
```bash
# 1. Run automated clear script
node clear-cache.js

# 2. Manual Cloudflare cache purge
curl -X POST "https://api.cloudflare.com/client/v4/zones/c7adab04543a89cb1361a604ecd22d8a/purge_cache" \
  -H "Authorization: Bearer UFd6NKA5tmLuyDHqukXTE_EHVsYVqenYFM6W9vO1" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# 3. Verify clearance
curl -I https://astro.theqalink.com/ | grep -i cache
```

#### Level 3: Force Complete Reset
```bash
# 1. Create emergency commit
git commit --allow-empty -m "EMERGENCY: Force cache reset"
git push

# 2. Wait for deployment (2-3 minutes)

# 3. Verify new cache version
curl -s https://astro.theqalink.com/ | grep -o 'v=[^"&]*'

# 4. Test critical pages
curl -I https://astro.theqalink.com/reviews/
curl -I https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية/
```

### Rollback to Timestamp-Based (Emergency)

If the new cache system causes issues:

#### 1. Quick Rollback
```javascript
// In src/pages/[slug].astro - replace:
import { getCacheBuster } from '../utils/cache-version.js';
const cacheBuster = getCacheBuster('page');

// With:
const cacheBuster = `?t=${Date.now()}`;
```

#### 2. Complete Rollback
```bash
# Restore package.json
git checkout HEAD~1 package.json

# Remove cache utilities
rm src/utils/cache-version.js
rm scripts/build.js
rm _build-info.js

# Rebuild and deploy
npm run build:simple
```

---

## ⚙️ Advanced Configuration

### Custom Cache Strategies

#### Create New Strategy
```javascript
// In src/utils/cache-version.js
export const CacheStrategy = {
  // ... existing strategies
  
  // New custom strategy
  WEEKLY: () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const week = weekStart.toISOString().split('T')[0];
    return `?v=${CACHE_VERSION}&w=${week}`;
  }
};
```

#### Use Custom Strategy
```javascript
import { CacheStrategy } from '../utils/cache-version.js';
const cacheBuster = CacheStrategy.WEEKLY();
```

### Environment-Specific Configuration

#### Development Environment
```javascript
// Auto-detection in cache-version.js
if (process.env.NODE_ENV === 'development') {
  return CacheStrategy.DEV(); // Uses timestamp
}
```

#### Production Optimization
```javascript
// Enhanced production cache
PRODUCTION: () => {
  const buildInfo = require('../build-info.json');
  return `?v=${buildInfo.cacheVersion}&env=prod`;
}
```

### Cloudflare Worker Integration

#### Update Worker Cache Headers
```javascript
// In broker-proxy-worker/worker.js
const cacheVersion = request.headers.get('X-Cache-Version');
return new Response(html, {
  headers: {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    'X-Cache-Version': cacheVersion,
    'Vary': 'CF-IPCountry, X-Cache-Version'
  }
});
```

---

## 📋 Best Practices

### Development Workflow

#### 1. Content Changes
```bash
# For content-only changes (no code)
git add src/content/
git commit -m "Update article: new broker review"
git push
# Cache will update automatically on deployment
```

#### 2. Code Changes
```bash
# For code changes that affect functionality
npm run build  # Test locally first
git add -A
git commit -m "feat: improve cache strategy"
git push
# New cache version will be generated
```

#### 3. Emergency Updates
```bash
# For urgent content fixes
node clear-cache.js  # Clear first
# Make changes...
git add -A
git commit -m "URGENT: fix broker rating data"
git push
```

### Performance Optimization

#### 1. Cache Strategy Selection
```javascript
// Choose appropriate strategy for content type
Static content    → getCacheBuster('page')     // Deployment cache
Daily updates     → getCacheBuster('reviews')  // Daily cache
Live data         → getCacheBuster('live')     // Hourly cache
User-specific     → getCacheBuster('user')     // No cache
```

#### 2. API Endpoint Optimization
```javascript
// Group similar content with same cache strategy
const brokerDataCache = getCacheBuster('reviews');
const ratesCache = getCacheBuster('live');
const userCache = getCacheBuster('user');

// Use appropriate cache for each API call
const brokers = await fetch(`/api/brokers${brokerDataCache}`);
const rates = await fetch(`/api/rates${ratesCache}`);
const profile = await fetch(`/api/user${userCache}`);
```

### Security Considerations

#### 1. Cache Version Exposure
- Cache versions are visible in URLs (by design)
- Contains no sensitive information
- Git hashes are public anyway

#### 2. User Data Protection
```javascript
// Always use user-specific cache for sensitive data
const userSettings = getCacheBuster('user'); // Ensures no caching
const publicData = getCacheBuster('page');   // Safe to cache
```

### Monitoring Best Practices

#### 1. Regular Health Checks
```bash
# Daily automated check script
#!/bin/bash
echo "Cache Health Check - $(date)"
echo "Current Version: $(node -p 'require("./src/build-info.json").cacheVersion')"
echo "Cache Test:"
node test-cache-version.js | grep "Current Version"
echo "---"
```

#### 2. Performance Tracking
Set up alerts for:
- Cache hit ratio < 80%
- Response time > 1 second
- Build failures
- Cache version not updating

#### 3. User Experience Monitoring
- Monitor page load times
- Track user complaints about stale content
- Check for cache-related errors in browser console

---

## 📞 Support & Maintenance

### Logs to Monitor
- Build logs: Cache version generation
- CF Pages logs: Deployment status
- CF Worker logs: Dynamic content injection
- Browser console: Cache strategy selection

### Regular Maintenance Tasks

#### Weekly
- [ ] Review cache hit rates
- [ ] Check for failed builds
- [ ] Verify cache strategies are working
- [ ] Update documentation if needed

#### Monthly
- [ ] Analyze cache performance trends
- [ ] Review and optimize cache strategies
- [ ] Clean up old build artifacts
- [ ] Update cache-related dependencies

#### Quarterly
- [ ] Full cache system audit
- [ ] Performance benchmark testing
- [ ] Review and update cache manual
- [ ] Plan cache strategy improvements

---

## 🔗 Reference Links

- **Cloudflare Cache Documentation**: https://developers.cloudflare.com/cache/
- **Astro Build Documentation**: https://docs.astro.build/en/guides/deploy/
- **HTTP Caching Best Practices**: https://web.dev/http-cache/

---

**Last Updated**: 2025-08-31  
**Cache System Version**: 2.0  
**Astro Version**: ^5.13.2