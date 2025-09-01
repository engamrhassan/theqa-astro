# 🎯 Cache System Best Practices

## ⚠️ **Golden Rule: Build-time vs Runtime**

### ✅ **DO: Build-time API Calls (Astro Components)**
```javascript
// In src/pages/*.astro files
export async function getStaticPaths() { ... }

// ✅ CORRECT: No cache busting during static generation
const response = await fetch('https://api.example.com/data');
```

**Why:**
- Allows API server caching during build
- Faster build times (~800ms vs 2.8s)
- Better API server performance
- Reduces API rate limiting issues

### ✅ **DO: Runtime API Calls (Client-side JavaScript)**
```javascript
// In browser JavaScript (not .astro files)
import { getCacheBuster } from './utils/cache-simple.js';

// ✅ CORRECT: Cache busting for user requests
const cacheBuster = getCacheBuster('live');
const response = await fetch(`https://api.example.com/data${cacheBuster}`);
```

**Why:**
- Prevents stale data for users
- Ensures fresh content updates
- User-specific cache invalidation

---

## 🏗️ Build-time Best Practices

### 1. API Calls in Astro Components
```javascript
// ❌ NEVER DO: Cache busting during build
const cacheBuster = `?t=${Date.now()}`;
const response = await fetch(API_CONFIG.url + cacheBuster); // 2.8s page generation

// ✅ ALWAYS DO: Allow server caching
const response = await fetch(API_CONFIG.url); // 800ms page generation
```

### 2. Static Path Generation
```javascript
// ✅ CORRECT: Fast static path generation
export async function getStaticPaths() {
  // No cache busting needed - this runs once during build
  const data = await fetch('https://api.example.com/pages');
  return data.map(item => ({ params: { slug: item.slug } }));
}
```

### 3. Content Collections
```javascript
// ✅ CORRECT: Use Astro's built-in content system
import { getCollection } from 'astro:content';
const articles = await getCollection('articles');
// No cache busting needed - handled by Astro
```

---

## 🌐 Runtime Best Practices

### 1. Client-side API Calls
```javascript
// ✅ CORRECT: In <script> tags or client-side components
document.addEventListener('DOMContentLoaded', async () => {
  const cacheBuster = getCacheBuster('live');
  const response = await fetch(`/api/live-data${cacheBuster}`);
  // Updates user interface with fresh data
});
```

### 2. User-specific Data
```javascript
// ✅ CORRECT: No caching for personal data
const userCache = getCacheBuster('user'); // Always unique
const profile = await fetch(`/api/profile${userCache}`);
```

### 3. Progressive Enhancement
```html
<!-- ✅ CORRECT: Static content first, then enhance -->
<div class="broker-list">
  <!-- Static fallback content from build -->
  <div class="static-brokers">...</div>
  
  <script>
    // Enhance with live data if needed
    const liveCache = getCacheBuster('live');
    fetch(`/api/brokers${liveCache}`)
      .then(response => response.json())
      .then(data => updateBrokerList(data));
  </script>
</div>
```

---

## 🚀 Performance Best Practices

### 1. Measure Performance
```bash
# ✅ ALWAYS: Test page load times
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://yourdomain.com/

# Target: <1 second
# Warning: >2 seconds (check for build-time cache busting)
```

### 2. Monitor Build Times
```bash
# ✅ TRACK: Build performance
time npm run build

# Target: <6 seconds
# Warning: >10 seconds (check API calls)
```

### 3. Use Health Checks
```bash
# ✅ REGULAR: Monitor cache health
npm run health:cache

# Check for warnings and errors
# Monitor response times
```

---

## 🔄 Cache Invalidation Best Practices

### 1. Content Updates
```javascript
// ✅ STRATEGY: Let builds handle content updates
// 1. Update content files
// 2. Run npm run build  
// 3. Deploy (triggers new static generation)
// 4. API calls during build get fresh data
```

### 2. Emergency Updates
```bash
# ✅ PROCESS: Emergency content fixes
# 1. Update source content
npm run build
git add . && git commit -m "Emergency update" && git push

# 2. Clear CDN if needed
npm run cache:clear

# 3. Verify performance
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://yourdomain.com/
```

### 3. User Cache Management
```javascript
// ✅ CLIENT-SIDE: Handle user cache
// For data that changes during user session
const sessionCache = getCacheBuster('user'); // Always unique
const userData = await fetch(`/api/user${sessionCache}`);
```

---

## 📊 Monitoring Best Practices

### 1. Performance Metrics
```javascript
// ✅ TRACK: Key performance indicators
const metrics = {
  pageLoadTime: '< 1 second',
  buildTime: '< 6 seconds', 
  apiResponseTime: '< 500ms',
  htmlGenerationTime: '< 500ms'
};
```

### 2. Automated Monitoring
```bash
# ✅ AUTOMATE: Performance checks
#!/bin/bash
# performance-check.sh
LOAD_TIME=$(curl -w "%{time_total}" -o /dev/null -s https://yourdomain.com/)
if (( $(echo "$LOAD_TIME > 1.0" | bc -l) )); then
  echo "WARNING: Page load time ${LOAD_TIME}s exceeds 1 second"
  exit 1
fi
```

### 3. Health Check Integration
```json
{
  "scripts": {
    "test:performance": "npm run health:cache && ./performance-check.sh",
    "deploy": "npm run build && npm run test:performance && git push"
  }
}
```

---

## 🚨 Common Mistakes to Avoid

### ❌ **DON'T: Cache Busting During Build**
```javascript
// ❌ WRONG: Causes 2-3 second page generation
const cacheBuster = `?t=${Date.now()}`;
const response = await fetch(API_CONFIG.url + cacheBuster);
```

### ❌ **DON'T: Import Cache Utils in .astro Files**
```javascript
// ❌ WRONG: Unnecessary for build-time calls
import { getCacheBuster } from '../utils/cache-simple.js';
```

### ❌ **DON'T: Over-optimize Caching**
```javascript
// ❌ WRONG: Complex caching for simple static content
const complexCache = generateComplexCacheKey();
const response = await fetch(API_CONFIG.url + complexCache);
```

### ❌ **DON'T: Ignore Performance Testing**
```bash
# ❌ WRONG: Deploy without testing
npm run build && git push
# Should be: npm run build && npm run health:cache && git push
```

---

## ✅ Recommended Architecture

### Build-time (Static Generation)
```
┌─────────────────┐
│ Astro Build     │
├─────────────────┤
│ • Fetch APIs    │ ← No cache busting
│ • Generate HTML │ ← Fast (~800ms)
│ • Bundle Assets │
│ • Deploy Static │
└─────────────────┘
```

### Runtime (User Requests)
```
┌─────────────────┐
│ User Request    │
├─────────────────┤
│ • Serve HTML    │ ← Pre-built (fast)
│ • Load Assets   │ ← Cached
│ • Client JS     │ ← Cache busting if needed
│ • API Calls     │ ← Fresh data for users
└─────────────────┘
```

---

## 📋 Checklist for New Features

### Before Adding API Calls:
- [ ] Is this a build-time or runtime API call?
- [ ] Do I need cache busting for this specific call?
- [ ] Have I tested the performance impact?
- [ ] Is this data user-specific or global?

### Build-time API Calls (.astro files):
- [ ] ✅ No cache busting used
- [ ] ✅ API server can cache responses
- [ ] ✅ Tested page generation speed
- [ ] ✅ Build completes in <6 seconds

### Runtime API Calls (client-side):
- [ ] ✅ Appropriate cache strategy selected
- [ ] ✅ User experience optimized
- [ ] ✅ Fallback content available
- [ ] ✅ Error handling implemented

### Performance Testing:
- [ ] ✅ Page loads in <1 second
- [ ] ✅ Build completes in <6 seconds
- [ ] ✅ Health check passes
- [ ] ✅ No performance regression

---

## 🎉 Success Criteria

Your cache system is working optimally when:

- ✅ **Page load time**: <1 second
- ✅ **Build time**: <6 seconds
- ✅ **No cache busting** in .astro files
- ✅ **Health check passes** without warnings
- ✅ **Content updates** work smoothly
- ✅ **User experience** is fast and responsive

Following these best practices ensures optimal performance while maintaining cache effectiveness! 🚀