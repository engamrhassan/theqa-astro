# 🚀 Cache System - Quick Reference Card

## ⚡ Emergency Commands
```bash
# Test page performance first
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://astro.theqalink.com/

# Clear CDN caches if needed
npm run cache:clear

# Force new deployment
git commit --allow-empty -m "Force refresh" && git push

# Check cache system health
npm run health:cache
```

## 🔄 Daily Commands
```bash
# Build with cache versioning
npm run build

# Test cache system health
node test-cache-version.js

# Check cache performance
curl -I https://astro.theqalink.com/ | grep -i cache
```

## 📊 Cache Strategy Guide

### ✅ **Build-time API Calls** (Astro Components)
```javascript
// CORRECT: No cache busting during static generation
const response = await fetch(API_CONFIG.url);
```

### ✅ **Client-side API Calls** (Browser JavaScript)
```javascript  
// CORRECT: Use cache busting for runtime requests
import { getCacheBuster } from './utils/cache-simple.js';
const cacheBuster = getCacheBuster('live');
const response = await fetch(API_CONFIG.url + cacheBuster);
```

| Context | Cache Busting | Performance | Use Case |
|---------|---------------|-------------|----------|
| **Build-time** | ❌ No | Fast (800ms) | Astro `.astro` files |
| **Client-side** | ✅ Yes | Varies | Browser JavaScript |

## 🎯 Example Cache URLs (Client-side Only)
```
Daily Cache:    ?v=2025-08-31
Hourly Cache:   ?v=2025-08-31-17  
No Cache:       ?t=1693478400000
```

⚠️ **Important**: Only use these for client-side JavaScript, NOT in Astro components!

## 🔧 Troubleshooting Quick Fixes

| Problem | Quick Solution |
|---------|----------------|
| **Slow page loading (2s+)** | Remove cache busting from build-time API calls |
| **Cache not updating** | `npm run cache:clear && git push` |
| **Build taking too long** | Don't use `getCacheBuster()` in `.astro` files |
| **Performance regression** | Test: `curl -w "Time: %{time_total}s\n" -s URL` |

## 📈 Performance Targets
- **Page Load Time**: <1 second
- **HTML Generation**: <500ms  
- **Build Time**: <6 seconds
- **API Response Time**: <500ms (build-time)

## 🚨 Emergency Contacts & Resources
- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **CF Pages Deployments**: Check build logs for cache version
- **Cache Documentation**: See `CACHE_MANUAL.md`
- **Test Commands**: Run `node test-cache-version.js`

---
*Keep this card handy for daily cache operations! 📌*