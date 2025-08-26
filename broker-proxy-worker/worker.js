// Cloudflare Worker for Dynamic Broker Sorting
export default {
  async fetch(request, env, ctx) {
    try {
      // Get user's country code from Cloudflare
      const countryCode = request.cf?.country || 'US';
      const url = new URL(request.url);

      // Fast path: check hardcoded routes first (no DB query)
      const isKnownBrokerRoute = url.pathname.includes('شركات-تداول-مرخصة-في-السعودية') ||
        url.pathname.includes('%D8%B4%D8%B1%D9%83%D8%A7%D8%AA') ||
        decodeURIComponent(url.pathname).includes('شركات-تداول-مرخصة-في-السعودية');

      // Create simple cache key that matches the URL you're purging
      const cacheKey = new Request(`${url.origin}${url.pathname}`);
      const cache = caches.default;

      // Check for cache bypass parameters
      const bypassCache = url.searchParams.has('nocache') ||
        url.searchParams.has('debug') ||
        url.searchParams.has('cache_bust') ||
        request.headers.get('Cache-Control')?.includes('no-cache');

      // Try cache first (unless bypassed)
      let cachedResponse = null;
      if (!bypassCache) {
        cachedResponse = await cache.match(cacheKey);
      }

      if (cachedResponse) {
        console.log(`Cache HIT for ${countryCode}: ${url.pathname}`);
        const responseBody = await cachedResponse.text();
        return new Response(responseBody, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: {
            ...Object.fromEntries(cachedResponse.headers.entries()),
            'X-Cache-Status': 'HIT',
            'X-Country-Code': countryCode,
            'X-Cache-Key': `${url.pathname}`,
            'X-Served-At': new Date().toISOString()
          }
        });
      }

      // Check if this route should be processed
      let shouldProcess = isKnownBrokerRoute;

      // Only check dynamic routes if not a known route (saves DB query)
      if (!shouldProcess) {
        shouldProcess = await checkDynamicRoute(env.DB, url.pathname);
      }

      if (!shouldProcess) {
        // For other pages, pass through to origin
        return fetch(request);
      }

      console.log(`Cache MISS for ${countryCode}: ${url.pathname}`);

      // Fetch original page (Astro handles the API call)
      const originalResponse = await fetch(request);
      if (!originalResponse.ok) {
        return originalResponse;
      }

      // Get HTML and inject broker data
      let html = await originalResponse.text();
      const brokerData = await getBrokersForCountry(env.DB, countryCode);
      html = injectBrokerData(html, brokerData, countryCode);

      // Create response with injected data and cache tags
      const modifiedResponse = new Response(html, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: {
          ...Object.fromEntries(originalResponse.headers.entries()),
          'Content-Type': 'text/html; charset=utf-8',
          'X-Country-Code': countryCode,
          'X-Cache-Status': 'MISS',
          'X-Broker-Count': brokerData.length.toString(),
          'X-Cache-Key': `${url.pathname}`,
          'X-Generated-At': new Date().toISOString(),
          // Cache tags for proper cache purging
          'Cache-Tag': `broker-page,country-${countryCode},dynamic-content`
        }
      });

      // Cache the response (only if not bypassed)
      if (!bypassCache) {
        const responseToCache = modifiedResponse.clone();
        const cacheHeaders = Object.fromEntries(responseToCache.headers.entries());
        cacheHeaders['Cache-Control'] = 'public, max-age=3600, s-maxage=3600'; // 1 hour
        cacheHeaders['Cache-Tag'] = `broker-page,country-${countryCode},dynamic-content`;
        cacheHeaders['Vary'] = 'CF-IPCountry, User-Agent';

        const cacheResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          headers: cacheHeaders
        });

        ctx.waitUntil(cache.put(cacheKey, cacheResponse));
      }

      return modifiedResponse;

    } catch (error) {
      console.error('Worker error:', error);
      const fallbackResponse = await fetch(request);
      const fallbackHeaders = Object.fromEntries(fallbackResponse.headers.entries());
      fallbackHeaders['X-Worker-Error'] = error.message;
      fallbackHeaders['X-Error-Timestamp'] = new Date().toISOString();

      return new Response(fallbackResponse.body, {
        status: fallbackResponse.status,
        headers: fallbackHeaders
      });
    }
  }
};

// Get brokers for specific country with improved error handling
async function getBrokersForCountry(database, countryCode) {
  const startTime = Date.now();

  try {
    // Primary query with country-specific sorting
    const query = `
      SELECT b.id, b.name, b.logo, b.rating, b.min_deposit, b.description, cs.sort_order
      FROM brokers b
      JOIN country_sorting cs ON b.id = cs.broker_id
      WHERE cs.country_code = ? AND b.is_active = 1
      ORDER BY cs.sort_order ASC
      LIMIT 6
    `;

    const result = await database.prepare(query).bind(countryCode).all();
    console.log(`Country query for ${countryCode} took ${Date.now() - startTime}ms`);

    if (result.results && result.results.length > 0) {
      return result.results;
    }

    // Fallback to default brokers if no country-specific data
    console.log(`No country-specific data for ${countryCode}, using defaults`);
    const defaultQuery = `
      SELECT id, name, logo, rating, min_deposit, description, default_sort_order as sort_order
      FROM brokers
      WHERE is_active = 1
      ORDER BY default_sort_order ASC
      LIMIT 4
    `;

    const defaultResult = await database.prepare(defaultQuery).all();
    return defaultResult.results || getHardcodedBrokers();

  } catch (error) {
    console.error(`Database error for ${countryCode}:`, error);
    return getHardcodedBrokers();
  }
}

// Hardcoded fallback brokers (for when DB is unavailable)
function getHardcodedBrokers() {
  return [
    {
      id: 1,
      name: 'eVest',
      rating: 4.2,
      min_deposit: 250,
      description: 'وسيط متعدد التنظيم مع فروق أسعار تنافسية',
      sort_order: 1
    },
    {
      id: 2,
      name: 'Exness',
      rating: 4.5,
      min_deposit: 10,
      description: 'وسيط شهير مع حد أدنى منخفض للإيداع',
      sort_order: 2
    },
    {
      id: 3,
      name: 'AvaTrade',
      rating: 4.1,
      min_deposit: 100,
      description: 'وسيط راسخ مع تنظيم قوي',
      sort_order: 3
    }
  ];
}

// Inject broker data into HTML with improved placeholder detection
function injectBrokerData(html, brokers, countryCode) {
  const brokerPlaceholder = '<!-- BROKERS_PLACEHOLDER -->';

  if (!html.includes(brokerPlaceholder)) {
    console.warn('Broker placeholder not found in HTML');
    return html;
  }

  const brokerHtml = generateBrokerHtml(brokers, countryCode);
  return html.replace(brokerPlaceholder, brokerHtml);
}

// Generate broker HTML with enhanced styling
function generateBrokerHtml(brokers, countryCode) {
  if (!brokers || brokers.length === 0) {
    return `
      <div style="text-align: center; padding: 2rem; color: #6b7280; background: #f9fafb; border-radius: 0.5rem;">
        <p>لا توجد شركات تداول متاحة حالياً في منطقتك.</p>
      </div>
    `;
  }

  let html = '<section class="brokers-section"><div class="companies-grid">';

  brokers.forEach((broker, index) => {
    const minDeposit = broker.min_deposit || 0;
    const rating = broker.rating || 0;
    const description = broker.description || 'وسيط موثوق للتداول';

    html += `
      <article class="company-card" data-position="${index + 1}" data-broker-id="${broker.id}">
        <div class="company-content">
          <h3>${broker.name}</h3>
          <p>${description}</p>
          <div class="company-features">
            <div class="feature">الحد الأدنى للإيداع: $${minDeposit}</div>
            <div class="feature">التقييم: ${'★'.repeat(Math.floor(rating))} (${rating})</div>
            <div class="feature">الترتيب: #${index + 1} في ${getCountryName(countryCode)}</div>
          </div>
        </div>
      </article>
    `;
  });

  html += '</div></section>';
  return html;
}

// Check if route should get dynamic broker data (cached for performance)
async function checkDynamicRoute(database, pathname) {
  try {
    const decodedPath = decodeURIComponent(pathname);

    // Simple check first (most common cases)
    const commonRoutes = [
      'شركات-تداول-مرخصة-في-السعودية',
      'brokers',
      'trading-companies',
      'forex-brokers'
    ];

    for (const route of commonRoutes) {
      if (decodedPath.includes(route)) {
        return true;
      }
    }

    // Database check for custom routes (if table exists)
    const query = `
      SELECT COUNT(*) as count
      FROM dynamic_routes
      WHERE is_active = 1 AND (
        ? LIKE '%' || route_pattern || '%' OR
        route_pattern LIKE '%' || ? || '%'
      )
      LIMIT 1
    `;

    const result = await database.prepare(query).bind(decodedPath, decodedPath).first();
    return result?.count > 0;

  } catch (error) {
    console.error('Route check error:', error);
    // Fallback to basic pattern matching
    const path = decodeURIComponent(pathname).toLowerCase();
    return path.includes('شركات-تداول-مرخصة-في-السعودية') ||
      path.includes('broker') ||
      path.includes('trading');
  }
}

// Helper function to get country name in Arabic
function getCountryName(countryCode = 'SA') {
  const countryNames = {
    'SA': 'السعودية',
    'AE': 'الإمارات',
    'KW': 'الكويت',
    'BH': 'البحرين',
    'QA': 'قطر',
    'OM': 'عمان',
    'JO': 'الأردن',
    'LB': 'لبنان',
    'EG': 'مصر',
    'IQ': 'العراق',
    'SY': 'سوريا',
    'YE': 'اليمن',
    'US': 'الولايات المتحدة',
    'GB': 'المملكة المتحدة',
    'DE': 'ألمانيا',
    'FR': 'فرنسا',
    'IT': 'إيطاليا',
    'ES': 'إسبانيا',
    'CA': 'كندا',
    'AU': 'أستراليا',
    'JP': 'اليابان',
    'CN': 'الصين',
    'IN': 'الهند',
    'BR': 'البرازيل',
    'RU': 'روسيا',
    'TR': 'تركيا',
    'ZA': 'جنوب أفريقيا'
  };

  return countryNames[countryCode] || 'منطقتك';
}