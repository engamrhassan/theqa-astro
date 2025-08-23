// Cloudflare Worker for Dynamic Broker Sorting
export default {
  async fetch(request, env, ctx) {
    try {
      // Get user's country code from Cloudflare
      const countryCode = request.cf?.country || 'US';
      const url = new URL(request.url);
      
      // Only process the broker page (Arabic URL)
      if (!url.pathname.includes('شركات-تداول-مرخصة-في-السعودية') && 
          !url.pathname.includes('%D8%B4%D8%B1%D9%83%D8%A7%D8%AA') &&
          !decodeURIComponent(url.pathname).includes('شركات-تداول-مرخصة-في-السعودية')) {
        // For other pages, just pass through to origin
        return fetch(request);
      }

      // Create country-specific cache key
      const cacheKey = new Request(`${url.origin}${url.pathname}-${countryCode}`);
      const cache = caches.default;
      
      // Check for cache bypass parameter
      const bypassCache = url.searchParams.has('nocache') || url.searchParams.has('debug');
      
      // Try cache first (unless bypassed)
      let cachedResponse = null;
      if (!bypassCache) {
        cachedResponse = await cache.match(cacheKey);
      }
      
      if (cachedResponse) {
        const responseBody = await cachedResponse.text();
        return new Response(responseBody, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: {
            ...Object.fromEntries(cachedResponse.headers.entries()),
            'X-Cache-Status': 'HIT',
            'X-Country-Code': countryCode
          }
        });
      }

      // Fetch original page
      const originalResponse = await fetch(request);
      if (!originalResponse.ok) {
        return originalResponse;
      }

      // Get HTML and inject broker data
      let html = await originalResponse.text();
      const brokerData = await getBrokersForCountry(env.DB, countryCode);
      html = injectBrokerData(html, brokerData);
      
      // Set country for helper function
      globalThis.currentUserCountry = countryCode;

      // Create response with injected data
      const modifiedResponse = new Response(html, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: {
          ...Object.fromEntries(originalResponse.headers.entries()),
          'Content-Type': 'text/html; charset=utf-8',
          'X-Country-Code': countryCode,
          'X-Cache-Status': 'MISS',
          'X-Broker-Count': brokerData.length.toString()
        }
      });

      // Cache the response
      const responseToCache = modifiedResponse.clone();
      const cacheHeaders = Object.fromEntries(responseToCache.headers.entries());
      cacheHeaders['Cache-Control'] = 'public, max-age=3600'; // Back to 1 hour
      cacheHeaders['Cache-Tag'] = `country-${countryCode}`;
      
      const cacheResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        headers: cacheHeaders
      });
      
      ctx.waitUntil(cache.put(cacheKey, cacheResponse));
      return modifiedResponse;

    } catch (error) {
      console.error('Worker error:', error);
      const fallbackResponse = await fetch(request);
      fallbackResponse.headers.set('X-Worker-Error', error.message);
      return fallbackResponse;
    }
  }
};

// Get brokers for specific country
async function getBrokersForCountry(database, countryCode) {
  try {
    const query = `
      SELECT b.id, b.name, b.logo, b.rating, b.min_deposit, b.description, cs.sort_order
      FROM brokers b
      JOIN country_sorting cs ON b.id = cs.broker_id
      WHERE cs.country_code = ? AND b.is_active = 1
      ORDER BY cs.sort_order ASC
      LIMIT 6
    `;
    
    const result = await database.prepare(query).bind(countryCode).all();
    
    if (result.results && result.results.length > 0) {
      return result.results;
    }
    
    // Fallback to default brokers
    const defaultQuery = `
      SELECT id, name, logo, rating, min_deposit, description, default_sort_order as sort_order
      FROM brokers
      WHERE is_active = 1
      ORDER BY default_sort_order ASC
      LIMIT 4
    `;
    
    const defaultResult = await database.prepare(defaultQuery).all();
    return defaultResult.results || [];
    
  } catch (error) {
    console.error('Database error:', error);
    return [
      { id: 1, name: 'eVest', rating: 4.2, min_deposit: 250, description: 'وسيط متعدد التنظيم مع فروق أسعار تنافسية' },
      { id: 2, name: 'Exness', rating: 4.5, min_deposit: 10, description: 'وسيط شهير مع حد أدنى منخفض للإيداع' }
    ];
  }
}

// Inject broker data into HTML
function injectBrokerData(html, brokers) {
  const brokerPlaceholder = '<!-- BROKERS_PLACEHOLDER -->';
  
  if (!html.includes(brokerPlaceholder)) {
    return html;
  }

  const brokerHtml = generateBrokerHtml(brokers);
  return html.replace(brokerPlaceholder, brokerHtml);
}

// Generate broker HTML
function generateBrokerHtml(brokers) {
  if (!brokers || brokers.length === 0) {
    return '<p>لا توجد شركات تداول متاحة حالياً</p>';
  }

  let html = '<section class="brokers-section"><div class="companies-grid">';
  
  brokers.forEach((broker, index) => {
    html += `
      <article class="company-card" data-position="${index + 1}">
        <div class="company-placeholder">
          <div class="placeholder-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>${broker.name}</span>
          </div>
        </div>
        <div class="company-content">
          <h3>${broker.name}</h3>
          <p>${broker.description}</p>
          <div class="company-features">
            <div class="feature">الحد الأدنى للإيداع: ${broker.min_deposit}</div>
            <div class="feature">التقييم: ${'★'.repeat(Math.floor(broker.rating))} (${broker.rating})</div>
            <div class="feature">ترتيب: #${index + 1} في ${getCountryName()}</div>
          </div>
        </div>
      </article>
    `;
  });
  
  html += '</div></section>';
  return html;
}

// Get country name in Arabic
function getCountryName() {
  const countryNames = {
    'SA': 'السعودية', 'AE': 'الإمارات', 'KW': 'الكويت', 'BH': 'البحرين',
    'QA': 'قطر', 'OM': 'عمان', 'JO': 'الأردن', 'LB': 'لبنان', 'EG': 'مصر',
    'US': 'الولايات المتحدة', 'GB': 'المملكة المتحدة', 'DE': 'ألمانيا',
    'FR': 'فرنسا', 'IT': 'إيطاليا', 'ES': 'إسبانيا', 'CA': 'كندا',
    'AU': 'أستراليا', 'JP': 'اليابان', 'KR': 'كوريا الجنوبية', 'CN': 'الصين',
    'IN': 'الهند', 'BR': 'البرازيل', 'MX': 'المكسيك', 'TR': 'تركيا', 'ZA': 'جنوب أفريقيا'
  };
  
  const userCountry = globalThis.currentUserCountry || 'SA';
  return countryNames[userCountry] || 'منطقتك';
}