// Cloudflare Worker for Dynamic Broker Sorting
export default {
  async fetch(request, env, ctx) {
    try {
      // Get user's country code from Cloudflare's CF object
      const countryCode = request.cf?.country || 'US';
      
      // Parse the request URL
      const url = new URL(request.url);
      
      console.log('Custom domain request - processing');
      console.log('Request path:', url.pathname);
      console.log('User country:', countryCode);
      
      // Check if this is a direct worker access for testing
      if (url.hostname.includes('workers.dev')) {
        console.log('Direct worker access - processing request');
        console.log('Request path:', url.pathname);
        console.log('User country:', countryCode);
        
        // If no specific path, fetch the broker page from your Pages site
        if (url.pathname === '/' || 
            url.pathname.includes('شركات-تداول-مرخصة-في-السعودية') ||
            url.pathname.includes('%D8%B4%D8%B1%D9%83%D8%A7%D8%AA') ||
            decodeURIComponent(url.pathname).includes('شركات-تداول-مرخصة-في-السعودية')) {
          const targetUrl = 'https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية/';
          console.log('Fetching from:', targetUrl);
          
          const originalResponse = await fetch(targetUrl);
          
          if (!originalResponse.ok) {
            return new Response(`Error fetching page: ${originalResponse.status}`, { status: originalResponse.status });
          }

          // Get the HTML content
          let html = await originalResponse.text();
          console.log('HTML length:', html.length);
          console.log('Contains placeholder:', html.includes('BROKERS_PLACEHOLDER'));

          // Fetch broker data based on country code from D1 database
          const brokerData = await getBrokersForCountry(env.DB, countryCode);
          console.log('Broker data count:', brokerData.length);
          
          // Inject the broker data into the HTML
          html = injectBrokerData(html, brokerData);
          
          // Set the country for the helper function
          globalThis.currentUserCountry = countryCode;

          // Return modified response
          return new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'X-Country-Code': countryCode,
              'X-Cache-Status': 'DIRECT-WORKER',
              'X-Broker-Count': brokerData.length.toString(),
              'X-Placeholder-Found': html.includes('BROKERS_PLACEHOLDER') ? 'true' : 'false'
            }
          });
        } else {
          // For other paths on direct worker, show info
          return new Response(`
            <h1>Broker Proxy Worker - Test Mode</h1>
            <p>Worker is running! Your country: ${countryCode}</p>
            <p>Current path: ${url.pathname}</p>
            <p>Test the broker page: <a href="/شركات-تداول-مرخصة-في-السعودية">شركات التداول</a></p>
            <p>Or visit: <a href="https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية/">Your actual site</a></p>
          `, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      }
      
      // Only process the broker page (Arabic URL) for proxied requests
      if (!url.pathname.includes('شركات-تداول-مرخصة-في-السعودية') && 
          !url.pathname.includes('%D8%B4%D8%B1%D9%83%D8%A7%D8%AA') &&
          !decodeURIComponent(url.pathname).includes('شركات-تداول-مرخصة-في-السعودية')) {
        // For other pages, just pass through to origin
        return fetch(request);
      }

      // Create a cache key that includes the country code (fix URL encoding)
      const cacheKey = new Request(`${url.origin}${url.pathname}-${countryCode}`);
      
      // Try to get the personalized page from cache first
      const cache = caches.default;
      
      // Check for cache bypass parameter for testing
      const bypassCache = url.searchParams.has('nocache') || url.searchParams.has('debug');
      
      let cachedResponse = null;
      if (!bypassCache) {
        cachedResponse = await cache.match(cacheKey); // Re-enable cache for performance
      }
      
      if (cachedResponse) {
        console.log(`Cache hit for ${url.pathname}-${countryCode}`);
        // Create new response to avoid immutable headers issue
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

      console.log(`Cache miss for ${url.pathname}-${countryCode}`);

      // Fetch the original page from your Astro Pages site
      const originalResponse = await fetch(request);
      
      if (!originalResponse.ok) {
        return originalResponse;
      }

      // Get the HTML content
      let html = await originalResponse.text();

      // Fetch broker data based on country code from D1 database
      const brokerData = await getBrokersForCountry(env.DB, countryCode);
      
      // Inject the broker data into the HTML
      html = injectBrokerData(html, brokerData);
      
      // Set the country for the helper function
      globalThis.currentUserCountry = countryCode;

      // Create new response with modified HTML (fix immutable headers)
      const originalHeaders = Object.fromEntries(originalResponse.headers.entries());
      const modifiedResponse = new Response(html, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: {
          ...originalHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'X-Country-Code': countryCode,
          'X-Cache-Status': 'MISS',
          'X-Broker-Count': brokerData.length.toString()
        }
      });

      // Cache the personalized response for 1 hour (shorter for testing)
      const responseToCache = modifiedResponse.clone();
      const cacheHeaders = Object.fromEntries(responseToCache.headers.entries());
      cacheHeaders['Cache-Control'] = 'public, max-age=60'; // Very short cache for testing
      cacheHeaders['Cache-Tag'] = `country-${countryCode}`; // Add cache tag for selective purging
      
      const cacheResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        headers: cacheHeaders
      });
      
      // Store in cache with country-specific key
      ctx.waitUntil(cache.put(cacheKey, cacheResponse));

      return modifiedResponse;

    } catch (error) {
      console.error('Worker error:', error);
      // Fallback to original request if something goes wrong
      const fallbackResponse = await fetch(request);
      // Add error header for debugging
      fallbackResponse.headers.set('X-Worker-Error', error.message);
      return fallbackResponse;
    }
  }
};

// Function to get brokers sorted by country from D1 database
async function getBrokersForCountry(database, countryCode) {
  try {
    // Optimized query with LIMIT for faster response
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
    
    // Faster fallback with limit
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
    // Return minimal sample data for fastest fallback
    return [
      { id: 1, name: 'eVest', rating: 4.2, min_deposit: 250, description: 'وسيط متعدد التنظيم مع فروق أسعار تنافسية' },
      { id: 2, name: 'Exness', rating: 4.5, min_deposit: 10, description: 'وسيط شهير مع حد أدنى منخفض للإيداع' }
    ];
  }
}

// Function to inject broker data into HTML with Arabic styling
function injectBrokerData(html, brokers) {
  // Look for a placeholder in your HTML where brokers should be injected
  const brokerPlaceholder = '<!-- BROKERS_PLACEHOLDER -->';
  
  if (!html.includes(brokerPlaceholder)) {
    console.warn('Broker placeholder not found in HTML');
    return html;
  }

  // Generate broker HTML with Arabic styling
  const brokerHtml = generateBrokerHtml(brokers);
  
  // Replace placeholder with actual broker data
  return html.replace(brokerPlaceholder, brokerHtml);
}

// Function to generate broker HTML (Arabic-styled for your site)
function generateBrokerHtml(brokers) {
  if (!brokers || brokers.length === 0) {
    return `
      <div style="background: #fee2e2; border: 2px solid #dc2626; padding: 1rem; margin: 1rem; border-radius: 8px;">
        <h3 style="color: #dc2626;">⚠️ Debug: No broker data</h3>
        <p>No brokers found in database for this country</p>
      </div>
    `;
  }

  let html = `
    <div style="background: #d1fae5; border: 2px solid #10b981; padding: 1rem; margin: 1rem; border-radius: 8px;">
      <h3 style="color: #10b981;">✅ Debug: Worker injected data successfully!</h3>
      <p>Found ${brokers.length} brokers for country: ${getCountryName()}</p>
    </div>
    <section class="brokers-section"><div class="companies-grid">
  `;
  
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

// Helper function to get country name in Arabic
function getCountryName() {
  // You can expand this mapping as needed
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
    'US': 'الولايات المتحدة',
    'GB': 'المملكة المتحدة',
    'DE': 'ألمانيا',
    'FR': 'فرنسا',
    'IT': 'إيطاليا',
    'ES': 'إسبانيا',
    'CA': 'كندا',
    'AU': 'أستراليا',
    'JP': 'اليابان',
    'KR': 'كوريا الجنوبية',
    'CN': 'الصين',
    'IN': 'الهند',
    'BR': 'البرازيل',
    'MX': 'المكسيك',
    'TR': 'تركيا',
    'ZA': 'جنوب أفريقيا'
  };
  
  // This will be set by the worker based on the user's country
  const userCountry = globalThis.currentUserCountry || 'SA';
  return countryNames[userCountry] || 'منطقتك';
}