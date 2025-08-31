# 🚀 Cache System - Quick Reference Card

## ⚡ Emergency Commands
```bash
# Clear all caches immediately
node clear-cache.js

# Force new cache version
git commit --allow-empty -m "Force refresh" && git push

# Check current cache version
cat src/build-info.json | grep cacheVersion
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

## 📊 Cache Strategies At-a-Glance

| Strategy | Code | Duration | Use Case | Cache Hit Rate |
|----------|------|----------|----------|----------------|
| **Deployment** | `getCacheBuster('page')` | Until redeploy | Static content | 95%+ |
| **Daily** | `getCacheBuster('reviews')` | 24 hours | Daily updates | 90%+ |
| **Hourly** | `getCacheBuster('live')` | 1 hour | Live data | 75%+ |
| **User** | `getCacheBuster('user')` | No cache | Personal data | 0% |

## 🎯 Example URLs Generated
```
Page Content:   ?v=0.0.1-3eee179
Broker Reviews: ?v=0.0.1-3eee179&d=2025-08-31
Live Data:      ?v=0.0.1-3eee179&h=2025-08-31-16
User Data:      ?v=0.0.1-3eee179&u=abc123
```

## 🔧 Troubleshooting Quick Fixes

| Problem | Quick Solution |
|---------|----------------|
| Cache not updating | `node clear-cache.js && git push` |
| Build info missing | `node scripts/build.js` |
| Wrong cache strategy | Check `getCacheBuster('type')` usage |
| CF Pages build failing | Set build command: `node _build-info.js && npm run build:simple` |

## 📈 Performance Targets
- **Cache Hit Rate**: >85%
- **Cache Response Time**: <100ms
- **API Response Time**: <500ms
- **Build Time**: <2 minutes

## 🚨 Emergency Contacts & Resources
- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **CF Pages Deployments**: Check build logs for cache version
- **Cache Documentation**: See `CACHE_MANUAL.md`
- **Test Commands**: Run `node test-cache-version.js`

---
*Keep this card handy for daily cache operations! 📌*