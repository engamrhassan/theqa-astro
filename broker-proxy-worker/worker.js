// Cloudflare Worker for Dynamic Broker Sorting
export default {
  async fetch(request, env, ctx) {
    try {
      // Get user's country code from Cloudflare's CF object
      const countryCode = request.cf?.country || 'US';
      
      // Parse the request URL
      const url = new URL(request.url);
      
      // Only process the broker page (Arabic URL)
      if (!url.pathname.includes('شركات-تداول-مرخصة-في-السعودية')) {
        // For other pages, just pass through to origin
        return fetch(request);
      }

      // Create a cache key that includes the country code
      const cacheKey = `${url.pathname}-${countryCode}`;
      
      // Try to get the personalized page from cache first
      const cache = caches.default;
      let cachedResponse = await cache.match(cacheKey);
      
      if (cachedResponse) {
        console.log(`Cache hit for ${cacheKey}`);
        // Add cache status header
        const response = new Response(cachedResponse.body, cachedResponse);
        response.headers.set('X-Cache-Status', 'HIT');
        response.headers.set('X-Country-Code', countryCode);
        return response;
      }

      console.log(`Cache miss for ${cacheKey}`);

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

      // Create new response with modified HTML
      const modifiedResponse = new Response(html, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: {
          ...originalResponse.headers,
          'Content-Type': 'text/html; charset=utf-8',
          'X-Country-Code': countryCode,
          'X-Cache-Status': 'MISS',
          'X-Broker-Count': brokerData.length.toString()
        }
      });

      // Cache the personalized response for 1 hour
      const responseToCache = modifiedResponse.clone();
      responseToCache.headers.set('Cache-Control', 'public, max-age=3600');
      
      // Store in cache with country-specific key
      ctx.waitUntil(cache.put(cacheKey, responseToCache));

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
    // Query D1 database for broker sorting based on country
    const query = `
      SELECT b.id, b.name, b.logo, b.rating, b.min_deposit, b.description, cs.sort_order
      FROM brokers b
      JOIN country_sorting cs ON b.id = cs.broker_id
      WHERE cs.country_code = ?
      ORDER BY cs.sort_order ASC
    `;
    
    const result = await database.prepare(query).bind(countryCode).all();
    
    if (result.results && result.results.length > 0) {
      console.log(`Found ${result.results.length} brokers for country: ${countryCode}`);
      return result.results;
    }
    
    // Fallback: get default broker sorting if no country-specific data
    console.log(`No country-specific data for ${countryCode}, using default sorting`);
    const defaultQuery = `
      SELECT id, name, logo, rating, min_deposit, description, default_sort_order as sort_order
      FROM brokers
      WHERE is_active = 1
      ORDER BY default_sort_order ASC
      LIMIT 6
    `;
    
    const defaultResult = await database.prepare(defaultQuery).all();
    return defaultResult.results || [];
    
  } catch (error) {
    console.error('Database error:', error);
    // Return sample data for testing if database fails
    return [
      {
        id: 1,
        name: 'eVest',
        logo: '/images/brokers/evest-logo.png',
        rating: 4.2,
        min_deposit: 250,
        description: 'وسيط متعدد التنظيم مع فروق أسعار تنافسية'
      },
      {
        id: 2,
        name: 'Exness',
        logo: '/images/brokers/exness-logo.png',
        rating: 4.5,
        min_deposit: 10,
        description: 'وسيط شهير مع حد أدنى منخفض للإيداع'
      }
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
    return '<p style="text-align: center; color: #6b7280; padding: 2rem;">لا توجد شركات تداول متاحة في منطقتك حالياً.</p>';
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
            <div class="feature">الحد الأدنى للإيداع: $${broker.min_deposit}</div>
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