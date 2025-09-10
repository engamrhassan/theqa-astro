var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
if (typeof globalThis.AbortController === "undefined") {
  globalThis.AbortController = class AbortController {
    static {
      __name(this, "AbortController");
    }
    constructor() {
      this.signal = { aborted: false };
    }
    abort() {
      this.signal.aborted = true;
    }
  };
}
var SimpleTemplate = class {
  static {
    __name(this, "SimpleTemplate");
  }
  static compile(template) {
    return function(data) {
      let result = template;
      result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, blockTemplate) => {
        const array = data[arrayKey] || [];
        return array.map((item) => {
          let blockResult = blockTemplate;
          blockResult = blockResult.replace(/\{\{([^}]+)\}\}/g, (varMatch, key) => {
            const trimmedKey = key.trim();
            if (trimmedKey.startsWith("{")) {
              const unescapedKey = trimmedKey.slice(1, -1).trim();
              return item[unescapedKey] || "";
            }
            return item[trimmedKey] || "";
          });
          return blockResult;
        }).join("");
      });
      result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        if (trimmedKey.startsWith("{")) {
          const unescapedKey = trimmedKey.slice(1, -1).trim();
          return data[unescapedKey] || "";
        }
        return data[trimmedKey] || "";
      });
      return result;
    };
  }
};
var BROKER_CARD_TEMPLATE = SimpleTemplate.compile(`
<article class="company-card" data-position="{{position}}" data-broker-id="{{brokerId}}">
  <div class="company-logo">
    <div class="company-logo-container" style="background: {{logoColor}}">
      <span class="broker-name">{{name}}</span>
    </div>
  </div>
  <div class="company-info">
    <div class="company-rating">
      <div class="company-stars">{{{starsHtml}}}</div>
    </div>
    <div class="company-license">
      <div class="company-license-label">\u0627\u0644\u062A\u0631\u0627\u062E\u064A\u0635</div>
      <div class="company-license-value">{{license}}</div>
    </div>
    <div class="company-details">
      <div class="company-min-deposit">\u0623\u0642\u0644 \u0645\u0628\u0644\u063A \u0644\u0644\u0625\u064A\u062F\u0627\u0639</div>
      <div class="company-deposit-amount">{{minDeposit}}</div>
    </div>
  </div>
  <button class="company-open-account-btn">\u0641\u062A\u062D \u062D\u0633\u0627\u0628</button>
</article>
`);
var BEGINNER_BROKER_TEMPLATE = SimpleTemplate.compile(`
<div class="broker-table-container">
  <h3 class="table-title">\u0623\u0641\u0636\u0644 \u0634\u0631\u0643\u0627\u062A \u0627\u0644\u062A\u062F\u0627\u0648\u0644 \u0644\u0644\u0645\u0628\u062A\u062F\u0626\u064A\u0646</h3>
  <div class="broker-table">
    <div class="table-header">
      <div class="header-cell">\u0627\u0644\u0634\u0631\u0643\u0629</div>
      <div class="header-cell">\u0623\u0642\u0644 \u0645\u0628\u0644\u063A \u0644\u0644\u0625\u064A\u062F\u0627\u0639</div>
      <div class="header-cell">\u0627\u0644\u062A\u0642\u064A\u064A\u0645</div>
      <div class="header-cell">\u0627\u0644\u0625\u062C\u0631\u0627\u0621</div>
    </div>
    {{#each brokers}}
    <div class="table-row">
      <div class="table-cell broker-name-cell">
        <div class="broker-logo-small" style="background: {{logoColor}}">{{name}}</div>
        <span class="broker-name-text">{{name}}</span>
      </div>
      <div class="table-cell">{{minDeposit}}</div>
      <div class="table-cell">
        <div class="rating-stars">{{{starsHtml}}}</div>
      </div>
      <div class="table-cell">
        <button class="action-btn">\u0641\u062A\u062D \u062D\u0633\u0627\u0628</button>
      </div>
    </div>
    {{/each}}
  </div>
</div>
`);
var POPULAR_BROKER_TEMPLATE = SimpleTemplate.compile(`
<div class="broker-table-container">
  <h3 class="table-title">\u0623\u0634\u0647\u0631 \u0634\u0631\u0643\u0627\u062A \u0627\u0644\u062A\u062F\u0627\u0648\u0644</h3>
  <div class="broker-table">
    <div class="table-header">
      <div class="header-cell">\u0627\u0644\u0634\u0631\u0643\u0629</div>
      <div class="header-cell">\u0639\u062F\u062F \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631\u064A\u0646</div>
      <div class="header-cell">\u0633\u0646\u0629 \u0627\u0644\u062A\u0623\u0633\u064A\u0633</div>
      <div class="header-cell">\u0627\u0644\u0625\u062C\u0631\u0627\u0621</div>
    </div>
    {{#each brokers}}
    <div class="table-row">
      <div class="table-cell broker-name-cell">
        <div class="broker-logo-small" style="background: {{logoColor}}">{{name}}</div>
        <span class="broker-name-text">{{name}}</span>
      </div>
      <div class="table-cell">{{investorCount}}</div>
      <div class="table-cell">{{foundingYear}}</div>
      <div class="table-cell">
        <button class="action-btn">\u0641\u062A\u062D \u062D\u0633\u0627\u0628</button>
      </div>
    </div>
    {{/each}}
  </div>
</div>
`);
function generateStarsHtml(rating = 4) {
  const stars = Math.min(Math.max(Math.round(rating), 1), 5);
  return Array(stars).fill().map(() => `
      <svg class="company-star" width="16" height="16" viewBox="0 0 24 24" fill="#2563eb">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    `).join("");
}
__name(generateStarsHtml, "generateStarsHtml");
function getBrokerLogoColor(brokerName) {
  const colors = {
    "Exness": "#fbbf24",
    "eVest": "#1e40af",
    "Evest": "#1e40af",
    "XTB": "#dc2626",
    "AvaTrade": "#4f46e5",
    "default": "#6b7280"
  };
  return colors[brokerName] || colors.default;
}
__name(getBrokerLogoColor, "getBrokerLogoColor");
var CacheMonitor = class {
  static {
    __name(this, "CacheMonitor");
  }
  constructor(env) {
    this.env = env;
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      countries: /* @__PURE__ */ new Map(),
      routes: /* @__PURE__ */ new Map()
    };
  }
  // Track cache performance
  async trackCacheHit(country, route, _cacheKey) {
    this.metrics.hits++;
    this.trackCountry(country);
    this.trackRoute(route);
    await this.persistMetrics();
  }
  async trackCacheMiss(country, route, reason = "expired") {
    this.metrics.misses++;
    this.trackCountry(country);
    this.trackRoute(route);
    console.log(`Cache miss for ${country}/${route}: ${reason}`);
    await this.persistMetrics();
  }
  trackCountry(country) {
    const count = this.metrics.countries.get(country) || 0;
    this.metrics.countries.set(country, count + 1);
  }
  trackRoute(route) {
    const count = this.metrics.routes.get(route) || 0;
    this.metrics.routes.set(route, count + 1);
  }
  async persistMetrics() {
    try {
      const metricsData = {
        timestamp: Date.now(),
        hits: this.metrics.hits,
        misses: this.metrics.misses,
        hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0,
        countries: Object.fromEntries(this.metrics.countries),
        routes: Object.fromEntries(this.metrics.routes)
      };
      await this.env.CACHE?.put("metrics:daily", JSON.stringify(metricsData), {
        expirationTtl: 86400
      });
    } catch (_error) {
      console.error("Failed to persist metrics:", _error);
    }
  }
  async getMetrics() {
    try {
      const cached = await this.env.CACHE?.get("metrics:daily", {
        type: "json"
      });
      return cached || this.metrics;
    } catch {
      return this.metrics;
    }
  }
  // Generate cache health report
  async generateHealthReport() {
    const metrics = await this.getMetrics();
    const hitRate = metrics.hits / (metrics.hits + metrics.misses) * 100 || 0;
    return {
      status: hitRate > 70 ? "healthy" : hitRate > 50 ? "warning" : "critical",
      hitRate: `${hitRate.toFixed(2)}%`,
      totalRequests: metrics.hits + metrics.misses,
      topCountries: Object.entries(metrics.countries || {}).sort(([, a], [, b]) => b - a).slice(0, 5),
      topRoutes: Object.entries(metrics.routes || {}).sort(([, a], [, b]) => b - a).slice(0, 5),
      recommendations: this.generateRecommendations(hitRate, metrics),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  generateRecommendations(hitRate, metrics) {
    const recommendations = [];
    if (hitRate < 50) {
      recommendations.push(
        "Consider increasing cache TTL for static broker data"
      );
    }
    if (metrics.misses > metrics.hits * 2) {
      recommendations.push(
        "Review cache invalidation strategy - too many cache misses"
      );
    }
    if (hitRate > 90) {
      recommendations.push(
        "Excellent cache performance! Consider expanding cache coverage"
      );
    }
    return recommendations;
  }
};
var worker_default = {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const timings = {};
    const monitor = new CacheMonitor(env);
    try {
      const url = new URL(request.url);
      const userCountry = request.cf?.country || "US";
      const cacheKey = `broker-data-${userCountry}-v2`;
      if (url.pathname === "/__health") {
        const healthReport = await monitor.generateHealthReport();
        return new Response(JSON.stringify(healthReport, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      }
      if (url.pathname === "/__metrics") {
        const metrics = await monitor.getMetrics();
        return new Response(JSON.stringify(metrics, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      }
      if (url.pathname === "/__purge-cache" && request.method === "POST") {
        return handleCachePurge(request, url, env);
      }
      if (url.pathname === "/__warm-cache" && request.method === "POST") {
        return handleWarmCache(request, env);
      }
      if (url.pathname === "/__debug") {
        return handleDebug(env, request);
      }
      if (url.pathname === "/__cache-status") {
        return handleCacheStatus(env, request, userCountry);
      }
      if (url.pathname === "/__cache-debug") {
        return handleCacheDebug(env, request, userCountry);
      }
      if (url.pathname === "/__perf-debug") {
        return handlePerfDebug(env, request, userCountry);
      }
      if (isStaticAsset(url.pathname)) {
        return fetch(request);
      }
      const excludedPages = [
        "/admin",
        "/login",
        "/contact",
        "/privacy-policy",
        "/terms-of-service",
        "/dashboard",
        "/cache-analyzer"
      ];
      if (excludedPages.includes(url.pathname)) {
        return fetch(request);
      }
      timings.staticCheck = Date.now() - startTime;
      const cacheCheckStart = Date.now();
      let brokerData = await getCachedBrokerData(env.CACHE, cacheKey);
      let unsupportedBrokers = [];
      const cacheHit = !!brokerData;
      timings.cacheCheck = Date.now() - cacheCheckStart;
      if (!brokerData) {
        await monitor.trackCacheMiss(userCountry, url.pathname, "not-found");
        const dataFetchStart = Date.now();
        [brokerData, unsupportedBrokers] = await Promise.all([
          getBrokersForCountryOptimized(env.DB, userCountry),
          getUnsupportedBrokersOptimized(env.DB, userCountry)
        ]);
        timings.dataFetch = Date.now() - dataFetchStart;
        await cacheBrokerData(
          env.CACHE,
          cacheKey,
          { brokerData, unsupportedBrokers },
          env.BROKER_CACHE_TTL || 1800
        );
      } else {
        await monitor.trackCacheHit(userCountry, url.pathname, cacheKey);
        unsupportedBrokers = brokerData.unsupportedBrokers || [];
        brokerData = brokerData.brokerData || [];
        timings.dataFetch = 0;
      }
      const processingTime = Date.now() - startTime;
      const cacheKeyForPage = `page-${url.pathname}-${userCountry}`;
      let response = await env.CACHE?.get(cacheKeyForPage, { type: "stream" });
      if (!response) {
        const originalResponse = await fetch(request);
        if (!originalResponse.ok) {
          return originalResponse;
        }
        ctx.waitUntil(
          env.CACHE?.put(cacheKeyForPage, originalResponse.clone(), {
            expirationTtl: 3600
            // 1 hour
          })
        );
        response = originalResponse;
      }
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        return response;
      }
      let html = await response.text();
      html = injectBrokerData(
        html,
        brokerData,
        userCountry,
        unsupportedBrokers
      );
      console.log(
        `Processing ${url.pathname} for country ${userCountry}, found ${unsupportedBrokers.length} restrictions`
      );
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=1800, s-maxage=3600, stale-while-revalidate=300",
          "X-Country-Code": userCountry,
          "X-Broker-Count": brokerData.length.toString(),
          "X-Unsupported-Count": unsupportedBrokers.length.toString(),
          "X-Cache-Key": cacheKey,
          "X-Cache-Hit": cacheHit.toString(),
          "X-Processing-Time": processingTime.toString(),
          "X-Timing-Cache": `${timings.cacheCheck}ms`,
          "X-Timing-Data": `${timings.dataFetch}ms`,
          "X-Timing-Route": `${timings.routeCheck}ms`,
          Vary: "CF-IPCountry",
          "X-Frame-Options": "SAMEORIGIN",
          "X-Content-Type-Options": "nosniff",
          "Last-Modified": (/* @__PURE__ */ new Date()).toUTCString(),
          ETag: `"${generateETag(brokerData, userCountry)}"`,
          "CF-Cache-Tag": `country:${userCountry},page:${url.pathname.replace(/[^a-zA-Z0-9]/g, "-")}`,
          "Edge-Cache-Tag": `broker-page-${userCountry}`
        }
      });
    } catch (error) {
      monitor.metrics.errors++;
      await monitor.persistMetrics();
      console.error("Worker error:", error);
      return createErrorResponse(error, request);
    }
  }
};
async function getCachedBrokerData(cache, key) {
  try {
    if (!cache) return null;
    const cached = await cache.get(key, { type: "json" });
    if (cached && cached.timestamp && Date.now() - cached.timestamp < 18e5) {
      return cached.data;
    }
    return null;
  } catch (error) {
    console.error("Cache read error:", error);
    return null;
  }
}
__name(getCachedBrokerData, "getCachedBrokerData");
async function cacheBrokerData(cache, key, data, ttl = 1800) {
  try {
    if (!cache) return;
    await cache.put(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now()
      }),
      {
        expirationTtl: ttl
        // Configurable TTL
      }
    );
  } catch (error) {
    console.error("Cache write error:", error);
  }
}
__name(cacheBrokerData, "cacheBrokerData");
function isStaticAsset(pathname) {
  const staticExtensions = [
    ".css",
    ".js",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".pdf",
    ".zip",
    ".mp4",
    ".webm",
    ".webp",
    ".avif",
    ".map",
    ".xml",
    ".txt",
    ".json",
    ".wasm"
  ];
  const staticPaths = [
    "/_astro/",
    "/images/",
    "/assets/",
    "/static/",
    "/public/",
    "/favicon.",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.json",
    "/.well-known/",
    "/sw.js",
    "/workbox-"
  ];
  const lowerPath = pathname.toLowerCase();
  return staticExtensions.some((ext) => lowerPath.endsWith(ext)) || staticPaths.some((path) => lowerPath.includes(path.toLowerCase()));
}
__name(isStaticAsset, "isStaticAsset");
function createErrorResponse(error, originalRequest) {
  const isHTMLRequest = originalRequest.headers.get("accept")?.includes("text/html");
  if (isHTMLRequest) {
    return new Response(
      `
      <html>
        <head><title>\u062E\u0637\u0623 \u0645\u0624\u0642\u062A</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 2rem;">
          <h1>\u062E\u0637\u0623 \u0645\u0624\u0642\u062A \u0641\u064A \u0627\u0644\u062E\u062F\u0645\u0629</h1>
          <p>\u0646\u0639\u062A\u0630\u0631 \u0639\u0646 \u0627\u0644\u0625\u0632\u0639\u0627\u062C\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u062E\u0644\u0627\u0644 \u0628\u0636\u0639 \u062F\u0642\u0627\u0626\u0642.</p>
          <button onclick="location.reload()">\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629</button>
        </body>
      </html>
    `,
      {
        status: 503,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache"
        }
      }
    );
  }
  return new Response(
    JSON.stringify({
      error: "Service temporarily unavailable",
      message: "\u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0644\u0627\u062D\u0642\u0627\u064B"
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" }
    }
  );
}
__name(createErrorResponse, "createErrorResponse");
async function handleCachePurge(request, url, env) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.PURGE_TOKEN}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await request.json().catch(() => ({}));
    const { pattern = "*", country = null } = body;
    if (env.CACHE) {
      if (country) {
        await env.CACHE.delete(`broker-data-${country}-v2`);
      } else {
        const countries = [
          "US",
          "GB",
          "DE",
          "SA",
          "AE",
          "EG",
          "TH",
          "FR",
          "IT",
          "ES"
        ];
        await Promise.all(
          countries.map((c) => env.CACHE.delete(`broker-data-${c}-v2`))
        );
      }
      if (pattern !== "*") {
        await env.CACHE.delete(`page-${pattern}-${country || "US"}`);
      }
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Cache purged successfully",
        purged_pattern: pattern,
        purged_country: country || "all"
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(handleCachePurge, "handleCachePurge");
async function checkDynamicRoute(database, pathname) {
  try {
    if (!database) return true;
    const decodedPath = decodeURIComponent(pathname);
    const commonRoutes = [
      "\u0634\u0631\u0643\u0627\u062A-\u062A\u062F\u0627\u0648\u0644-\u0645\u0631\u062E\u0635\u0629-\u0641\u064A-\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629",
      "\u0645\u0646\u0635\u0627\u062A-\u062A\u062F\u0627\u0648\u0644-\u0627\u0644\u0639\u0645\u0644\u0627\u062A-\u0627\u0644\u0631\u0642\u0645\u064A\u0629-\u0641\u064A-\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A",
      "reviews",
      "brokers",
      "trading-companies"
    ];
    for (const route of commonRoutes) {
      if (decodedPath.includes(route)) {
        return true;
      }
    }
    const exactQuery = `SELECT 1 FROM dynamic_routes WHERE route_pattern = ? AND is_active = 1 LIMIT 1`;
    let result = await database.prepare(exactQuery).bind(decodedPath).first();
    if (result) return true;
    const patternQuery = `SELECT 1 FROM dynamic_routes WHERE is_active = 1 AND (? LIKE '%' || route_pattern || '%') LIMIT 1`;
    result = await database.prepare(patternQuery).bind(decodedPath).first();
    return !!result;
  } catch (error) {
    console.error("Error checking dynamic route:", error);
    const decodedPath = decodeURIComponent(pathname);
    return decodedPath.includes("\u062A\u062F\u0627\u0648\u0644") || decodedPath.includes("broker") || decodedPath.includes("review");
  }
}
__name(checkDynamicRoute, "checkDynamicRoute");
async function getBrokersForCountry(database, countryCode) {
  try {
    const query = `
      SELECT 
        b.id, b.name, b.logo, b.rating, b.min_deposit, b.description,
        b.investor_count, b.founding_year,
        COALESCE(cs.sort_order, b.default_sort_order) as sort_order
      FROM brokers b
      LEFT JOIN country_sorting cs ON b.id = cs.broker_id AND cs.country_code = ?
      WHERE b.is_active = 1
      ORDER BY COALESCE(cs.sort_order, b.default_sort_order) ASC
      LIMIT 6
    `;
    const result = await database.prepare(query).bind(countryCode).all();
    if (result.results && result.results.length > 0) {
      return result.results;
    }
    return getDefaultBrokers();
  } catch (error) {
    console.error("Database error:", error);
    return getHardcodedBrokers();
  }
}
__name(getBrokersForCountry, "getBrokersForCountry");
async function getUnsupportedBrokers(database, countryCode) {
  try {
    if (!database) return [];
    const query = `
      SELECT 
        uc.broker_id,
        uc.company_id,
        b.name as broker_name,
        uc.restriction_type,
        uc.reason,
        ab.id as alternative_id,
        ab.name as alternative_name,
        ab.logo as alternative_logo,
        ab.website_url as alternative_url
      FROM unsupported_countries uc
      JOIN brokers b ON uc.broker_id = b.id
      LEFT JOIN brokers ab ON uc.alternative_broker_id = ab.id
      WHERE uc.country_code = ? AND uc.is_active = 1
    `;
    const result = await database.prepare(query).bind(countryCode).all();
    if (result.results) {
      return result.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching unsupported brokers:", error);
    return [];
  }
}
__name(getUnsupportedBrokers, "getUnsupportedBrokers");
function getDefaultBrokers() {
  return [
    {
      id: 1,
      name: "Exness",
      rating: 4.5,
      min_deposit: 10,
      logo: "",
      description: "\u0648\u0633\u064A\u0637 \u0645\u0648\u062B\u0648\u0642"
    },
    {
      id: 2,
      name: "XTB",
      rating: 4,
      min_deposit: 100,
      logo: "",
      description: "\u0648\u0633\u064A\u0637 \u0645\u0646\u0638\u0645"
    },
    {
      id: 3,
      name: "AvaTrade",
      rating: 4,
      min_deposit: 100,
      logo: "",
      description: "\u0648\u0633\u064A\u0637 \u0639\u0627\u0644\u0645\u064A"
    },
    {
      id: 4,
      name: "Evest",
      rating: 4.5,
      min_deposit: 50,
      logo: "",
      description: "\u0648\u0633\u064A\u0637 \u0645\u062A\u0642\u062F\u0645"
    }
  ];
}
__name(getDefaultBrokers, "getDefaultBrokers");
function getHardcodedBrokers() {
  return [
    {
      id: 1,
      name: "Exness",
      rating: 4.5,
      min_deposit: 10,
      logo: "",
      description: "\u0648\u0633\u064A\u0637 \u0645\u0648\u062B\u0648\u0642 \u0644\u0644\u062A\u062F\u0627\u0648\u0644",
      investor_count: "3.1M+",
      founding_year: "2008"
    },
    {
      id: 2,
      name: "XTB",
      rating: 4,
      min_deposit: 100,
      logo: "",
      description: "\u0648\u0633\u064A\u0637 \u0645\u0646\u0638\u0645 \u0648\u0645\u0631\u062E\u0635",
      investor_count: "1.8M+",
      founding_year: "2002"
    },
    {
      id: 3,
      name: "AvaTrade",
      rating: 4,
      min_deposit: 100,
      logo: "",
      description: "\u0648\u0633\u064A\u0637 \u0639\u0627\u0644\u0645\u064A \u0645\u0648\u062B\u0648\u0642",
      investor_count: "1.2M+",
      founding_year: "2006"
    },
    {
      id: 4,
      name: "Evest",
      rating: 4.5,
      min_deposit: 50,
      logo: "",
      description: "\u0648\u0633\u064A\u0637 \u0645\u062A\u0642\u062F\u0645 \u0648\u0645\u0628\u062A\u0643\u0631",
      investor_count: "2.5M+",
      founding_year: "2018"
    }
  ];
}
__name(getHardcodedBrokers, "getHardcodedBrokers");
function injectBrokerData(html, brokers, countryCode, unsupportedBrokers = []) {
  try {
    const countryName = getCountryName(countryCode);
    const countryDataScript = `
    <script>
        window.USER_COUNTRY = '${countryCode}';
        window.COUNTRY_NAME = '${countryName}';
        window.UNSUPPORTED_BROKERS = ${JSON.stringify(unsupportedBrokers)};
        console.log('Worker injected data:', {
          country: '${countryCode}',
          brokers: ${brokers.length},
          unsupported: ${unsupportedBrokers.length}
        });
    <\/script>
  `;
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${countryDataScript}</head>`);
    } else {
      html = html.replace("<body>", `<body>${countryDataScript}`);
    }
    const brokerPlaceholder = "<!-- BROKERS_PLACEHOLDER -->";
    if (html.includes(brokerPlaceholder)) {
      const brokerHtml = generateBrokerHtml(brokers, countryCode);
      html = html.replace(brokerPlaceholder, brokerHtml);
    }
    const beginnerPlaceholder = "<!-- BEGINNER_BROKERS_PLACEHOLDER -->";
    if (html.includes(beginnerPlaceholder)) {
      const beginnerHtml = generateBeginnerBrokerHtml(brokers, countryCode);
      html = html.replace(beginnerPlaceholder, beginnerHtml);
    }
    if (html.includes("[beginner-57]")) {
      const beginnerHtml = generateBeginnerBrokerHtml(brokers, countryCode);
      html = html.replace(/\[beginner-57\]/g, beginnerHtml);
    }
    const popularPlaceholder = "<!-- POPULAR_BROKERS_PLACEHOLDER -->";
    if (html.includes(popularPlaceholder)) {
      const popularHtml = generatePopularBrokerHtml(brokers, countryCode);
      html = html.replace(popularPlaceholder, popularHtml);
    }
    if (html.includes("[popular-58]")) {
      const popularHtml = generatePopularBrokerHtml(brokers, countryCode);
      html = html.replace(/\[popular-58\]/g, popularHtml);
    }
    return html;
  } catch (error) {
    console.error("Error injecting broker data:", error);
    return html;
  }
}
__name(injectBrokerData, "injectBrokerData");
function generateBrokerHtml(brokers, _countryCode) {
  if (!brokers || brokers.length === 0) {
    return `
      <div style="text-align: center; padding: 2rem; color: #6b7280; background: #f9fafb; border-radius: 0.5rem;">
        <p>\u0644\u0627 \u062A\u0648\u062C\u062F \u0634\u0631\u0643\u0627\u062A \u062A\u062F\u0627\u0648\u0644 \u0645\u062A\u0627\u062D\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u0645\u0646\u0637\u0642\u062A\u0643.</p>
      </div>
    `;
  }
  const brokerCards = brokers.map(
    (broker, index) => BROKER_CARD_TEMPLATE({
      name: broker.name,
      logoColor: getBrokerLogoColor(broker.name),
      starsHtml: generateStarsHtml(broker.rating),
      license: "FCA",
      // Default license
      minDeposit: broker.min_deposit || 0,
      position: index + 1,
      brokerId: broker.id
    })
  ).join("");
  return `<div class="companies-grid">${brokerCards}</div>`;
}
__name(generateBrokerHtml, "generateBrokerHtml");
function generateBeginnerBrokerHtml(brokers, _countryCode) {
  if (!brokers || brokers.length === 0) {
    return `
      <div style="text-align: center; padding: 2rem; color: #6b7280; background: #f9fafb; border-radius: 0.5rem;">
        <p>\u0644\u0627 \u062A\u0648\u062C\u062F \u0634\u0631\u0643\u0627\u062A \u062A\u062F\u0627\u0648\u0644 \u0645\u062A\u0627\u062D\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u0645\u0646\u0637\u0642\u062A\u0643.</p>
      </div>
    `;
  }
  const topBrokers = brokers.slice(0, 4).map((broker, index) => ({
    name: broker.name,
    logoColor: getBrokerLogoColor(broker.name),
    minDeposit: broker.min_deposit || 0,
    rating: broker.rating || 0,
    starsHtml: generateStarsHtml(broker.rating),
    position: index + 1,
    brokerId: broker.id
  }));
  return BEGINNER_BROKER_TEMPLATE({ brokers: topBrokers });
}
__name(generateBeginnerBrokerHtml, "generateBeginnerBrokerHtml");
function generatePopularBrokerHtml(brokers, _countryCode) {
  if (!brokers || brokers.length === 0) {
    return `
      <div style="text-align: center; padding: 2rem; color: #6b7280; background: #f9fafb; border-radius: 0.5rem;">
        <p>\u0644\u0627 \u062A\u0648\u062C\u062F \u0634\u0631\u0643\u0627\u062A \u062A\u062F\u0627\u0648\u0644 \u0645\u062A\u0627\u062D\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u0645\u0646\u0637\u0642\u062A\u0643.</p>
      </div>
    `;
  }
  const topBrokers = brokers.slice(0, 4).map((broker, index) => ({
    name: broker.name,
    logoColor: getBrokerLogoColor(broker.name),
    investorCount: broker.investor_count || "1.5M+",
    foundingYear: broker.founding_year || "2010",
    position: index + 1,
    brokerId: broker.id
  }));
  return POPULAR_BROKER_TEMPLATE({ brokers: topBrokers });
}
__name(generatePopularBrokerHtml, "generatePopularBrokerHtml");
function getCountryName(countryCode = "SA") {
  const countryNames = {
    SA: "\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629",
    AE: "\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A",
    KW: "\u0627\u0644\u0643\u0648\u064A\u062A",
    BH: "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
    QA: "\u0642\u0637\u0631",
    OM: "\u0639\u0645\u0627\u0646",
    JO: "\u0627\u0644\u0623\u0631\u062F\u0646",
    LB: "\u0644\u0628\u0646\u0627\u0646",
    EG: "\u0645\u0635\u0631",
    MA: "\u0627\u0644\u0645\u063A\u0631\u0628",
    TN: "\u062A\u0648\u0646\u0633",
    DZ: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631",
    IQ: "\u0627\u0644\u0639\u0631\u0627\u0642",
    SY: "\u0633\u0648\u0631\u064A\u0627",
    YE: "\u0627\u0644\u064A\u0645\u0646",
    LY: "\u0644\u064A\u0628\u064A\u0627",
    SD: "\u0627\u0644\u0633\u0648\u062F\u0627\u0646",
    US: "\u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0627\u0644\u0645\u062A\u062D\u062F\u0629",
    GB: "\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629",
    DE: "\u0623\u0644\u0645\u0627\u0646\u064A\u0627",
    FR: "\u0641\u0631\u0646\u0633\u0627",
    IT: "\u0625\u064A\u0637\u0627\u0644\u064A\u0627",
    ES: "\u0625\u0633\u0628\u0627\u0646\u064A\u0627",
    TH: "\u062A\u0627\u064A\u0644\u0627\u0646\u062F"
  };
  return countryNames[countryCode] || "\u0628\u0644\u062F\u0643";
}
__name(getCountryName, "getCountryName");
async function warmCache(env) {
  const countries = [
    "US",
    "GB",
    "DE",
    "SA",
    "AE",
    "EG",
    "FR",
    "ES",
    "IT",
    "TH",
    "KW",
    "BH",
    "QA",
    "OM",
    "JO"
  ];
  const routes = [
    "/\u0634\u0631\u0643\u0627\u062A-\u062A\u062F\u0627\u0648\u0644-\u0645\u0631\u062E\u0635\u0629-\u0641\u064A-\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629",
    "/\u0645\u0646\u0635\u0627\u062A-\u062A\u062F\u0627\u0648\u0644-\u0627\u0644\u0639\u0645\u0644\u0627\u062A-\u0627\u0644\u0631\u0642\u0645\u064A\u0629-\u0641\u064A-\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A",
    "/reviews"
  ];
  console.log("Starting cache warming...");
  const warmPromises = [];
  for (const country of countries) {
    for (const route of routes) {
      warmPromises.push(warmCacheForCountryRoute(env, country, route));
    }
  }
  const results = await Promise.allSettled(warmPromises);
  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  console.log(
    `Cache warming completed: ${successful} successful, ${failed} failed`
  );
  const warmingReport = {
    timestamp: Date.now(),
    successful,
    failed,
    total: warmPromises.length,
    countries: countries.length,
    routes: routes.length
  };
  try {
    await env.CACHE?.put("warming:last-run", JSON.stringify(warmingReport), {
      expirationTtl: 86400
      // 24 hours
    });
  } catch (error) {
    console.error("Failed to store warming report:", error);
  }
  return warmingReport;
}
__name(warmCache, "warmCache");
async function warmCacheForCountryRoute(env, country, route) {
  try {
    const cacheKey = `broker-data-${country}-v2`;
    const existing = await getCachedBrokerData(env.CACHE, cacheKey);
    if (existing) {
      console.log(`Cache already warm for ${country}${route}`);
      return;
    }
    const [brokerData, unsupportedBrokers] = await Promise.all([
      getBrokersForCountry(env.DB, country),
      getUnsupportedBrokers(env.DB, country)
    ]);
    await cacheBrokerData(env.CACHE, cacheKey, {
      brokerData,
      unsupportedBrokers
    });
    console.log(
      `\u2705 Warmed cache for ${country}${route} (${brokerData.length} brokers, ${unsupportedBrokers.length} restrictions)`
    );
  } catch (error) {
    console.error(`\u274C Failed to warm cache for ${country}${route}:`, error);
    throw error;
  }
}
__name(warmCacheForCountryRoute, "warmCacheForCountryRoute");
async function handleWarmCache(request, env) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.PURGE_TOKEN}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const warmingResult = await warmCache(env);
    return new Response(
      JSON.stringify(
        {
          success: true,
          message: "Cache warming completed",
          ...warmingResult
        },
        null,
        2
      ),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(handleWarmCache, "handleWarmCache");
async function handleDebug(env, request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country") || request.cf?.country || "US";
  try {
    const debug = {
      request: {
        country: request.cf?.country,
        colo: request.cf?.colo,
        timezone: request.cf?.timezone,
        requestedCountry: country,
        userAgent: request.headers.get("User-Agent"),
        ip: request.headers.get("CF-Connecting-IP")
      },
      cache: {
        keys: getCacheKeys(country),
        brokerDataKey: `broker-data-${country}-v2`
      },
      database: {
        brokersCount: 0,
        countrySortingCount: 0,
        unsupportedCount: 0
      },
      worker: {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        version: "2.0-enhanced"
      }
    };
    try {
      const [brokersResult, sortingResult, unsupportedResult] = await Promise.all([
        env.DB.prepare(
          "SELECT COUNT(*) as count FROM brokers WHERE is_active = 1"
        ).first(),
        env.DB.prepare(
          "SELECT COUNT(*) as count FROM country_sorting WHERE country_code = ?"
        ).bind(country).first(),
        env.DB.prepare(
          "SELECT COUNT(*) as count FROM unsupported_countries WHERE country_code = ? AND is_active = 1"
        ).bind(country).first()
      ]);
      debug.database.brokersCount = brokersResult?.count || 0;
      debug.database.countrySortingCount = sortingResult?.count || 0;
      debug.database.unsupportedCount = unsupportedResult?.count || 0;
    } catch (error) {
      debug.database.error = error.message;
    }
    try {
      const cachedData = await getCachedBrokerData(
        env.CACHE,
        debug.cache.brokerDataKey
      );
      debug.cache.status = {
        cached: !!cachedData,
        dataAge: cachedData ? getDataAge(cachedData) : null,
        brokerCount: cachedData?.brokerData?.length || 0,
        restrictionCount: cachedData?.unsupportedBrokers?.length || 0
      };
    } catch (error) {
      debug.cache.error = error.message;
    }
    return new Response(JSON.stringify(debug, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(handleDebug, "handleDebug");
async function handleCacheStatus(env, request, userCountry) {
  try {
    const cacheKey = `broker-data-${userCountry}-v2`;
    const [cachedData, metrics] = await Promise.all([
      getCachedBrokerData(env.CACHE, cacheKey),
      env.CACHE?.get("metrics:daily", { type: "json" })
    ]);
    const status = {
      country: userCountry,
      cacheKey,
      cached: !!cachedData,
      dataAge: cachedData ? getDataAge(cachedData) : null,
      brokerCount: cachedData?.brokerData?.length || 0,
      restrictionCount: cachedData?.unsupportedBrokers?.length || 0,
      hitRate: metrics ? calculateHitRate(metrics) : "N/A",
      recommendations: generateCacheRecommendations(cachedData, metrics),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    return new Response(JSON.stringify(status, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(handleCacheStatus, "handleCacheStatus");
function getCacheKeys(country) {
  return [
    `broker-data-${country}-v2`,
    `page-/reviews-${country}`,
    `page-/\u0634\u0631\u0643\u0627\u062A-\u062A\u062F\u0627\u0648\u0644-\u0645\u0631\u062E\u0635\u0629-\u0641\u064A-\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629-${country}`,
    `page-/\u0645\u0646\u0635\u0627\u062A-\u062A\u062F\u0627\u0648\u0644-\u0627\u0644\u0639\u0645\u0644\u0627\u062A-\u0627\u0644\u0631\u0642\u0645\u064A\u0629-\u0641\u064A-\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A-${country}`,
    "metrics:daily",
    "warming:last-run"
  ];
}
__name(getCacheKeys, "getCacheKeys");
function getDataAge(cachedData) {
  if (cachedData.timestamp) {
    const ageMs = Date.now() - cachedData.timestamp;
    const ageMinutes = Math.floor(ageMs / 6e4);
    const ageHours = Math.floor(ageMinutes / 60);
    if (ageHours > 0) {
      return `${ageHours}h ${ageMinutes % 60}m`;
    }
    return `${ageMinutes}m`;
  }
  return "unknown";
}
__name(getDataAge, "getDataAge");
function calculateHitRate(metrics) {
  const total = (metrics.hits || 0) + (metrics.misses || 0);
  if (total === 0) return "N/A";
  return `${((metrics.hits || 0) / total * 100).toFixed(1)}%`;
}
__name(calculateHitRate, "calculateHitRate");
function generateCacheRecommendations(cachedData, metrics) {
  const recommendations = [];
  if (!cachedData) {
    recommendations.push(
      "Cache is empty - consider warming cache for this country"
    );
  }
  if (metrics) {
    const hitRate = parseFloat(calculateHitRate(metrics).replace("%", ""));
    if (hitRate < 50) {
      recommendations.push("Low hit rate - consider increasing cache TTL");
    } else if (hitRate > 90) {
      recommendations.push("Excellent cache performance!");
    }
  }
  if (cachedData?.brokerData?.length === 0) {
    recommendations.push("No broker data found - check database configuration");
  }
  if (cachedData && getDataAge(cachedData).includes("h")) {
    recommendations.push("Cache data is getting old - will refresh soon");
  }
  return recommendations.length > 0 ? recommendations : ["Cache performance looks good"];
}
__name(generateCacheRecommendations, "generateCacheRecommendations");
async function handleCacheDebug(env, request, userCountry) {
  const url = new URL(request.url);
  const testPath = url.searchParams.get("path") || "/\u0634\u0631\u0643\u0627\u062A-\u062A\u062F\u0627\u0648\u0644-\u0645\u0631\u062E\u0635\u0629-\u0641\u064A-\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629";
  try {
    const cacheTests = [];
    const brokerCacheKey = `broker-data-${userCountry}-v2`;
    const cachedBrokerData = await getCachedBrokerData(
      env.CACHE,
      brokerCacheKey
    );
    cacheTests.push({
      test: "Broker Data Cache (KV)",
      key: brokerCacheKey,
      result: cachedBrokerData ? "FOUND" : "NOT_FOUND",
      dataAge: cachedBrokerData ? getDataAge(cachedBrokerData) : "N/A",
      brokerCount: cachedBrokerData?.brokerData?.length || 0
    });
    const shouldProcess = await checkDynamicRoute(env.DB, testPath);
    cacheTests.push({
      test: "Route Processing",
      path: testPath,
      result: shouldProcess ? "ELIGIBLE" : "NOT_ELIGIBLE"
    });
    let dbTest = { test: "Database Connectivity", result: "ERROR" };
    try {
      const brokerData = await getBrokersForCountry(env.DB, userCountry);
      const unsupportedBrokers = await getUnsupportedBrokers(
        env.DB,
        userCountry
      );
      dbTest = {
        test: "Database Connectivity",
        result: "SUCCESS",
        brokerCount: brokerData.length,
        unsupportedCount: unsupportedBrokers.length
      };
    } catch (error) {
      dbTest.error = error.message;
    }
    cacheTests.push(dbTest);
    let metricsTest = { test: "Metrics Storage", result: "ERROR" };
    try {
      const metrics = await env.CACHE?.get("metrics:daily", { type: "json" });
      metricsTest = {
        test: "Metrics Storage",
        result: metrics ? "FOUND" : "NOT_FOUND",
        hits: metrics?.hits || 0,
        misses: metrics?.misses || 0,
        hitRate: metrics ? calculateHitRate(metrics) : "N/A"
      };
    } catch (error) {
      metricsTest.error = error.message;
    }
    cacheTests.push(metricsTest);
    const debugInfo = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userCountry,
      testPath,
      worker: {
        version: "2.0-enhanced",
        environment: env.ENVIRONMENT || "unknown"
      },
      cacheTests,
      request: {
        url: request.url,
        country: request.cf?.country,
        colo: request.cf?.colo,
        userAgent: request.headers.get("User-Agent")
      },
      recommendations: generateCacheDebugRecommendations(cacheTests)
    };
    return new Response(JSON.stringify(debugInfo, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(handleCacheDebug, "handleCacheDebug");
function generateCacheDebugRecommendations(cacheTests) {
  const recommendations = [];
  const brokerCache = cacheTests.find((t) => t.test === "Broker Data Cache (KV)");
  const routeProcessing = cacheTests.find((t) => t.test === "Route Processing");
  const dbConnectivity = cacheTests.find(
    (t) => t.test === "Database Connectivity"
  );
  const metrics = cacheTests.find((t) => t.test === "Metrics Storage");
  if (brokerCache?.result === "NOT_FOUND") {
    recommendations.push("Broker cache empty - first request or cache expired");
  }
  if (routeProcessing?.result === "NOT_ELIGIBLE") {
    recommendations.push(
      "Route not eligible for processing - check dynamic_routes table"
    );
  }
  if (dbConnectivity?.result === "ERROR") {
    recommendations.push(
      "Database connection failed - check D1 binding and database status"
    );
  } else if (dbConnectivity?.brokerCount === 0) {
    recommendations.push("No broker data in database - check brokers table");
  }
  if (metrics?.result === "NOT_FOUND") {
    recommendations.push(
      "No metrics data - monitoring system may be initializing"
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "All systems operational - cache and database working correctly"
    );
  }
  return recommendations;
}
__name(generateCacheDebugRecommendations, "generateCacheDebugRecommendations");
function generateETag(brokerData, country) {
  const content = JSON.stringify({
    brokerData: brokerData.map((b) => ({ id: b.id, name: b.name })),
    country,
    timestamp: Math.floor(Date.now() / 36e5)
    // Hour-based ETag
  });
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
__name(generateETag, "generateETag");
async function getBrokersForCountryOptimized(database, countryCode) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e3);
    const query = `
      SELECT 
        b.id, b.name, b.logo, b.rating, b.min_deposit, b.description,
        b.investor_count, b.founding_year,
        COALESCE(cs.sort_order, b.default_sort_order) as sort_order
      FROM brokers b
      LEFT JOIN country_sorting cs ON b.id = cs.broker_id AND cs.country_code = ?
      WHERE b.is_active = 1
      ORDER BY COALESCE(cs.sort_order, b.default_sort_order) ASC
      LIMIT 6
    `;
    const result = await database.prepare(query).bind(countryCode).all();
    clearTimeout(timeoutId);
    if (result.results && result.results.length > 0) {
      return result.results;
    }
    return getHardcodedBrokersOptimized();
  } catch (error) {
    console.error(`Optimized broker query failed for ${countryCode}:`, error);
    return getHardcodedBrokersOptimized();
  }
}
__name(getBrokersForCountryOptimized, "getBrokersForCountryOptimized");
async function getUnsupportedBrokersOptimized(database, countryCode) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);
    const query = `
      SELECT 
        uc.broker_id, uc.restriction_type, uc.reason,
        b.name as broker_name,
        alt.id as alternative_id, alt.name as alternative_name, 
        alt.logo as alternative_logo, alt.website_url as alternative_url
      FROM unsupported_countries uc
      JOIN brokers b ON uc.broker_id = b.id
      LEFT JOIN brokers alt ON uc.alternative_broker_id = alt.id
      WHERE uc.country_code = ? AND uc.is_active = 1 AND b.is_active = 1
    `;
    const result = await database.prepare(query).bind(countryCode).all();
    clearTimeout(timeoutId);
    return result.results || [];
  } catch (error) {
    console.error(
      `Unsupported brokers query failed for ${countryCode}:`,
      error
    );
    return [];
  }
}
__name(getUnsupportedBrokersOptimized, "getUnsupportedBrokersOptimized");
function getHardcodedBrokersOptimized() {
  return [
    {
      id: 1,
      name: "Exness",
      rating: 4.5,
      min_deposit: 10,
      sort_order: 1,
      investor_count: "3.1M+",
      founding_year: "2008"
    },
    {
      id: 2,
      name: "eVest",
      rating: 4.2,
      min_deposit: 250,
      sort_order: 2,
      investor_count: "2.5M+",
      founding_year: "2018"
    },
    {
      id: 3,
      name: "XTB",
      rating: 4.3,
      min_deposit: 250,
      sort_order: 3,
      investor_count: "1.8M+",
      founding_year: "2002"
    },
    {
      id: 4,
      name: "AvaTrade",
      rating: 4.1,
      min_deposit: 100,
      sort_order: 4,
      investor_count: "1.2M+",
      founding_year: "2006"
    }
  ];
}
__name(getHardcodedBrokersOptimized, "getHardcodedBrokersOptimized");
async function handlePerfDebug(env, request, userCountry) {
  const url = new URL(request.url);
  const testPath = url.searchParams.get("path") || "/\u0634\u0631\u0643\u0627\u062A-\u062A\u062F\u0627\u0648\u0644-\u0645\u0631\u062E\u0635\u0629-\u0641\u064A-\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629";
  const timings = {};
  const startTime = Date.now();
  const dbStart = Date.now();
  try {
    const brokers = await getBrokersForCountryOptimized(env.DB, userCountry);
    timings.database = Date.now() - dbStart;
    timings.brokerCount = brokers.length;
  } catch (error) {
    timings.database = Date.now() - dbStart;
    timings.databaseError = error.message;
  }
  timings.routeCheck = 0;
  timings.shouldProcess = true;
  const cacheStart = Date.now();
  if (env.CACHE) {
    const cacheKey = `perf-test-${Date.now()}`;
    await env.CACHE.put(cacheKey, "test", { expirationTtl: 60 });
    const retrieved = await env.CACHE.get(cacheKey);
    timings.cache = Date.now() - cacheStart;
    timings.cacheWorking = !!retrieved;
    await env.CACHE.delete(cacheKey);
  } else {
    timings.cache = 0;
    timings.cacheWorking = false;
  }
  const monitorStart = Date.now();
  try {
    const monitor = new CacheMonitor(env);
    await monitor.trackCacheHit(userCountry, testPath, "test-key");
    timings.monitoring = Date.now() - monitorStart;
    timings.monitoringWorking = true;
  } catch (error) {
    timings.monitoring = Date.now() - monitorStart;
    timings.monitoringWorking = false;
    timings.monitoringError = error.message;
  }
  timings.total = Date.now() - startTime;
  const recommendations = [];
  if (timings.database > 500)
    recommendations.push(
      "Database queries are slow - consider optimizing queries or adding indexes"
    );
  if (timings.routeCheck > 100)
    recommendations.push(
      "Route checking is slow - route cache should improve this"
    );
  if (!timings.cacheWorking)
    recommendations.push(
      "Cache is not working - check KV namespace configuration"
    );
  if (!timings.monitoringWorking)
    recommendations.push(
      "Monitoring system has issues - check CacheMonitor implementation"
    );
  if (timings.total > 1e3)
    recommendations.push(
      "Overall response is slow - consider more aggressive caching"
    );
  if (timings.total < 100)
    recommendations.push(
      "Excellent performance! All systems running optimally"
    );
  return new Response(
    JSON.stringify(
      {
        timings,
        recommendations,
        country: userCountry,
        testPath,
        worker: {
          version: "2.0-enhanced-perf",
          environment: env.ENVIRONMENT || "unknown"
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      null,
      2
    ),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
}
__name(handlePerfDebug, "handlePerfDebug");
async function scheduled(event, env, _ctx) {
  try {
    console.log("Cron trigger: Starting scheduled cache warming");
    const result = await warmCache(env);
    console.log("Cron trigger: Cache warming completed", result);
    if (env.CACHE) {
      await env.CACHE.put(
        "warming:last-cron",
        JSON.stringify({
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          trigger: "cron",
          ...result
        }),
        {
          expirationTtl: 86400
          // 24 hours
        }
      );
    }
  } catch (error) {
    console.error("Cron trigger: Cache warming failed", error);
  }
}
__name(scheduled, "scheduled");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-24vvts/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-24vvts/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default,
  handleWarmCache,
  scheduled,
  warmCache
};
//# sourceMappingURL=worker.js.map
