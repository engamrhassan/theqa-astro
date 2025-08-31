# 🚨 Performance Rollback Guide

If the new cache system is causing performance issues, here are quick rollback options:

## Option 1: Emergency Rollback (Fastest)

### Step 1: Switch to Simple Cache
```bash
# Replace cache imports with simple version
sed -i 's/cache-version-fast.js/cache-simple.js/g' src/pages/*.astro
```

### Step 2: Or completely remove cache versioning
```bash
# Edit src/pages/[slug].astro
# Replace:
import { getCacheBuster } from '../utils/cache-version-fast.js';
const cacheBuster = getCacheBuster('page');

# With:
const cacheBuster = ''; // No cache busting
```

## Option 2: Revert to Original Timestamp

### Edit src/pages/[slug].astro
```javascript
// Replace cache import and usage with:
const cacheBuster = `?t=${Date.now()}`;
```

### Edit src/pages/reviews.astro
```javascript
// Replace cache import and usage with:
const cacheBuster = `?t=${Date.now()}`;
const response = await fetch(`https://theqalink.com/api/v1/reviews${cacheBuster}`, requestOptions);
```

## Option 3: Disable Cache Completely

### For [slug].astro
```javascript
// Remove cache busting entirely
const response = await fetch(API_CONFIG.url, {
  method: "GET",
  headers: API_CONFIG.headers,
  redirect: "follow"
});
```

### For reviews.astro
```javascript
// Remove cache busting entirely  
const response = await fetch("https://theqalink.com/api/v1/reviews", requestOptions);
```

## Quick Test Commands

```bash
# Test build performance
time npm run build:simple

# Test page load time
curl -w "%{time_total}\n" -o /dev/null -s https://astro.theqalink.com/

# Compare before/after
echo "Testing original..."
time curl -s https://astro.theqalink.com/ > /dev/null
```

## Restore Package.json (if needed)

```json
{
  "scripts": {
    "build": "astro build",
    "dev": "astro dev", 
    "preview": "astro preview"
  }
}
```

## Remove Cache Files (if needed)

```bash
rm -f src/utils/cache-version.js
rm -f src/utils/cache-version-fast.js
rm -f src/utils/cache-simple.js
rm -f cache-health-check.js
rm -f test-cache-version.js
rm -f scripts/build.js
rm -f _build-info.js
```

Choose the option that gives you the best performance!