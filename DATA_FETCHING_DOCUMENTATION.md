# TheQA Astro - Data Fetching & Caching Architecture

## Overview

This documentation explains how data is fetched, cached, and injected into content in the TheQA Astro project. The system combines static site generation with dynamic content injection using Cloudflare Workers and multiple caching layers.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Sources & Endpoints](#data-sources--endpoints)
3. [Data Fetching Methods](#data-fetching-methods)
4. [Caching Strategy](#caching-strategy)
5. [Content Injection](#content-injection)
6. [Static Content Management](#static-content-management)
7. [Error Handling](#error-handling)

---

## Architecture Overview

The project uses a hybrid approach combining:

- **Static Generation (SSG)**: Astro builds static pages at build time
- **Dynamic Enhancement**: Cloudflare Workers inject personalized content based on user location
- **Multi-layered Caching**: Edge caching, database caching, and client-side fallbacks

```mermaid
graph TD
    A[User Request] --> B[Cloudflare Edge]
    B --> C{Static Asset?}
    C -->|Yes| D[Serve Static File]
    C -->|No| E[Worker Processing]
    E --> F[Astro Static Page]
    E --> G[D1 Database Query]
    E --> H[Inject Dynamic Content]
    F --> I[HTML Response]
    G --> I
    H --> I
    I --> J[Cache & Serve]
```

---

## Data Sources & Endpoints

### External API Endpoints

1. **Page Content API**
   - Endpoint: `https://theqalink.com/api/v1/page/{slug}`
   - Used for: Dynamic page content retrieval
   - Authentication: API key + Basic Auth
   - Data: Page title, content, metadata

2. **Reviews/Brokers API**
   - Endpoint: `https://theqalink.com/api/v1/reviews`
   - Used for: Broker information and reviews
   - Authentication: API key + Basic Auth
   - Data: Broker details, ratings, regulations, minimum deposits

### Internal Data Sources

1. **Astro Content Collections**
   - Location: `src/content/articles/`
   - Type: Markdown files with frontmatter
   - Schema: Defined in `src/content/config.ts`
   - Used for: Blog articles and static content

2. **Cloudflare D1 Database**
   - Tables: `brokers`, `country_sorting`, `unsupported_countries`, `dynamic_routes`
   - Used for: Country-specific broker rankings and restrictions
   - Worker: `broker-proxy-worker`

---

## Data Fetching Methods

### 1. Static Site Generation (Build Time)

#### Content Collections
```javascript
// src/pages/articles/[...slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const articles = await getCollection('articles');
  return articles.map((article) => ({
    params: { slug: article.slug },
    props: article,
  }));
}
```

#### API Fetching in Astro Components
```javascript
// src/pages/[slug].astro
const API_CONFIG = {
  url: `https://theqalink.com/api/v1/page/${apiSlug}`,
  headers: {
    "Accept": "application/json",
    "X-API-Hash": "b3da624e147174b654c4c9358ac40c4ca716cb9db56b0da0e2f8200553922ac0",
    "Authorization": "Basic YWRtaW46U0F3S3EzQUg5bVZxVg==",
    "Cache-Control": "no-cache"
  }
};

// No cache busting needed for build-time API calls (static generation)
// Cache busting is only needed for runtime/client-side requests
const response = await fetch(API_CONFIG.url, {
  method: "GET",
  headers: API_CONFIG.headers,
  redirect: "follow"
});
```

#### Reviews Data Fetching
```javascript
// src/pages/reviews.astro
async function fetchReviewBrokers(): Promise<ReviewBroker[]> {
  try {
    // No cache busting needed for build-time API calls (static generation)
    const response = await fetch("https://theqalink.com/api/v1/reviews", requestOptions);
    const data = await response.json();
    
    // Transform and normalize data
    return reviewsArray.map((item: any) => ({
      id: item.id || item.broker_id || Math.random().toString(36).substr(2, 9),
      name: item.name || item.title || item.company_name || 'شركة تداول',
      rating: parseFloat(item.rating) || Math.floor(Math.random() * 2) + 4,
      // ... more transformations
    }));
  } catch (error) {
    // Fallback data when API fails
    return hardcodedFallbackData;
  }
}
```

### 2. Runtime Enhancement (Cloudflare Workers)

#### Worker Data Fetching
```javascript
// broker-proxy-worker/worker.js
async function getBrokersForCountry(database, countryCode) {
  const query = `
    SELECT b.id, b.name, b.logo, b.rating, b.min_deposit, b.description, 
           cs.sort_order, uc.restriction_type, uc.reason, uc.alternative_broker_id
    FROM brokers b
    JOIN country_sorting cs ON b.id = cs.broker_id
    LEFT JOIN unsupported_countries uc ON b.id = uc.broker_id AND uc.country_code = ?
    WHERE cs.country_code = ? AND b.is_active = 1
    ORDER BY cs.sort_order ASC
    LIMIT 6
  `;
  
  const result = await database.prepare(query).bind(countryCode, countryCode).all();
  return result.results || getHardcodedBrokers();
}
```

---

## Caching Strategy

### 1. Build-Time Caching
- **Static Generation**: Pages built once and cached until next deployment
- **Content Collections**: Markdown files processed at build time
- **Asset Optimization**: CSS/JS bundled and minified
- **API Calls**: No cache busting needed - allows server-side caching during build

#### ⚠️ **Important**: Build-time vs Runtime Caching
```javascript
// ❌ DON'T: Cache busting during static generation (causes performance issues)
const cacheBuster = `?t=${Date.now()}`;
const response = await fetch(API_CONFIG.url + cacheBuster); // Slow build times

// ✅ DO: Allow API server caching during build
const response = await fetch(API_CONFIG.url); // Fast build times
```

### 2. Cloudflare Edge Caching
```javascript
// broker-proxy-worker/worker.js
return new Response(html, {
  headers: {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=300',
    'Vary': 'CF-IPCountry', // Cache varies by country
    'X-Country-Code': countryCode,
    'X-Broker-Count': brokerData.length.toString()
  }
});
```

**Cache Configuration:**
- **TTL**: 1 hour (3600 seconds)
- **Stale-while-revalidate**: 5 minutes (300 seconds)
- **Varies by**: User's country (CF-IPCountry header)

### 3. API Response Caching

#### Build-time API Calls (Static Generation)
```javascript
// No cache busting needed - allows API server caching during build
const response = await fetch(API_CONFIG.url);
```

#### Runtime API Calls (Client-side)
```javascript
// Cache busting may be needed for dynamic content
import { getCacheBuster } from './utils/cache-simple.js';
const cacheBuster = getCacheBuster('live'); // For frequently changing data
const response = await fetch(API_CONFIG.url + cacheBuster);
```

### 4. Cache Invalidation
```javascript
// clear-cache.js - Manual cache clearing
async function clearAllCaches() {
  // Step 1: Clear Cloudflare Edge Cache
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
    method: 'POST',
    body: JSON.stringify({
      files: [
        'https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية/',
        'https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية'
      ]
    })
  });
}
```

---

## Content Injection

### 1. Placeholder-Based Injection

#### HTML Placeholders
```html
<!-- Static HTML contains placeholders -->
<div class="brokers-placeholder">
  <!-- BROKERS_PLACEHOLDER -->
  <div class="fallback-brokers">
    <!-- Static fallback content -->
  </div>
</div>
```

#### Worker Injection
```javascript
// broker-proxy-worker/worker.js
function injectBrokerData(html, brokers, countryCode, unsupportedBrokers) {
  // Replace placeholder with dynamic content
  const brokerPlaceholder = '<!-- BROKERS_PLACEHOLDER -->';
  if (html.includes(brokerPlaceholder)) {
    const brokerHtml = generateBrokerHtml(brokers, countryCode);
    html = html.replace(brokerPlaceholder, brokerHtml);
  }
  
  // Handle shortcode replacements
  if (html.includes('[beginner-57]')) {
    const beginnerHtml = generateBeginnerBrokerHtml(brokers, countryCode);
    html = html.replace(/\[beginner-57\]/g, beginnerHtml);
  }
  
  return html;
}
```

### 2. JavaScript Data Injection
```javascript
// Country-specific data injected as global variables
const countryDataScript = `
  <script>
    window.USER_COUNTRY = '${countryCode}';
    window.UNSUPPORTED_BROKERS = ${JSON.stringify(unsupportedBrokers)};
    window.COUNTRY_NAME = '${countryName}';
  </script>
`;

html = html.replace('</head>', countryDataScript + '</head>');
```

### 3. Client-Side Fallbacks
```javascript
// src/components/BrokerList.astro
setTimeout(() => {
  const fallbackBrokers = document.querySelector('.fallback-brokers');
  
  if (fallbackBrokers) {
    const dynamicContent = document.querySelector('.companies-grid');
    
    if (!dynamicContent) {
      fallbackBrokers.style.display = 'flex';
    }
  }
}, 3000); // Show fallback after 3 seconds
```

### 4. Dynamic HTML Generation
```javascript
// Generate broker cards dynamically
function generateBrokerHtml(brokers, countryCode) {
  let html = '<div class="companies-grid">';
  
  brokers.forEach((broker, index) => {
    html += `
      <article class="company-card" data-broker-id="${broker.id}">
        <div class="company-logo">
          <div class="company-logo-container" style="background: ${getBrokerLogoColor(broker.name)};">
            <span class="broker-name">${broker.name}</span>
          </div>
        </div>
        <div class="company-info">
          <div class="company-details">
            <div class="company-min-deposit">أقل مبلغ للإيداع</div>
            <div class="company-deposit-amount">${broker.min_deposit}</div>
          </div>
        </div>
        <button class="company-open-account-btn">فتح حساب</button>
      </article>
    `;
  });
  
  html += '</div>';
  return html;
}
```

---

## Static Content Management

### Content Collections Schema
```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const articleCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    author: z.string(),
    image: image(),
    imageAlt: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});
```

### Static Path Generation
```javascript
// Generate static paths for dynamic routes
export async function getStaticPaths() {
  return [
    {
      params: { slug: 'شركات-تداول-مرخصة-في-السعودية' },
      props: {
        apiSlug: 'شركات-تداول-مرخصة-في-السعودية',
        defaultTitle: 'شركات التداول المرخصة في السعودية',
        defaultDescription: 'دليل شامل لأهم شركات التداول المرخصة والموثوقة'
      }
    }
  ];
}
```

---

## Error Handling

### API Failure Handling
```javascript
try {
  const response = await fetch(API_CONFIG.url + cacheBuster, {
    method: "GET",
    headers: API_CONFIG.headers,
    redirect: "follow"
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  // Process successful response
  
} catch (err) {
  console.error('Error fetching page data:', err);
  error = err instanceof Error ? err.message : 'حدث خطأ في تحميل البيانات';
  pageData = null; // Use fallback content
}
```

### Graceful Degradation
```javascript
// Show error state when API fails
{!pageData && (
  <div class="error-state">
    <div class="error-content">
      <h2>خطأ في تحميل المحتوى</h2>
      <p>عذراً، لم نتمكن من تحميل محتوى الصفحة. يرجى المحاولة مرة أخرى لاحقاً.</p>
      {error && <p>تفاصيل الخطأ: {error}</p>}
      <button class="retry-button" onclick="window.location.reload()">إعادة المحاولة</button>
    </div>
  </div>
)}
```

### Worker Error Handling
```javascript
// broker-proxy-worker/worker.js
export default {
  async fetch(request, env, ctx) {
    try {
      // Main processing logic
      return processRequest(request, env);
    } catch (error) {
      console.error('Worker error:', error);
      // On error, pass through to origin without modification
      return fetch(request);
    }
  }
};
```

---

## Performance Optimizations

### 1. Build-Time Optimizations
- **Static Generation**: Pre-built HTML reduces server load
- **Asset Bundling**: CSS/JS combined and minified
- **Image Optimization**: Responsive images with lazy loading

### 2. Runtime Optimizations
- **Country-based Caching**: Content cached per geographic region
- **Stale-while-revalidate**: Serve cached content while updating in background
- **Database Query Optimization**: Limited results with proper indexing

### 3. Client-Side Optimizations
- **Lazy Loading**: Images and non-critical content loaded on demand
- **Fallback Content**: Immediate display while dynamic content loads
- **Progressive Enhancement**: Basic functionality works without JavaScript

---

## Development Workflow

### 1. Content Updates
```bash
# Update articles (triggers rebuild)
git add src/content/articles/
git commit -m "Add new article"
git push origin main  # Triggers Cloudflare Pages deployment
```

### 2. Cache Management
```bash
# Clear all caches after deployment
node clear-cache.js

# Update worker cache version
# Edit broker-proxy-worker/wrangler.toml
npx wrangler deploy
```

### 3. Database Updates
```bash
# Update broker data in D1 database
npx wrangler d1 execute broker-sorting-db --file=./schema.sql
```

---

## Monitoring & Debugging

### Logging
- **Worker Logs**: Available in Cloudflare Dashboard
- **Build Logs**: Available in Cloudflare Pages Dashboard
- **Client Logs**: Browser console shows cache hits/misses

### Debug Headers
```
X-Country-Code: SA           # User's detected country
X-Broker-Count: 4            # Number of brokers served
X-Unsupported-Count: 2       # Number of restricted brokers
Cache-Control: public, max-age=3600  # Cache policy
```

### Performance Metrics
- **Time to First Byte**: < 200ms (cached)
- **Largest Contentful Paint**: < 2.5s
- **Cache Hit Ratio**: > 90% for repeat visitors

---

This architecture provides a robust, scalable solution for serving personalized financial content with excellent performance and reliability.