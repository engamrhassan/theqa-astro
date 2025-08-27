// Cloudflare Worker for Dynamic Broker Sorting
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Cache purge endpoint (for manual clearing when needed)
      if (url.pathname === '/__purge-cache' && request.method === 'POST') {
        return handleCachePurge(request, url, env);
      }
      
      // Get user's country code from Cloudflare
      const countryCode = request.cf?.country || 'US';
      
      // Check if this route should get dynamic broker data
      const shouldProcess = await checkDynamicRoute(env.DB, url.pathname);
      
      if (!shouldProcess) {
        // For other pages, pass through to origin
        return fetch(request);
      }

      // Fetch original page from Astro
      const originalResponse = await fetch(request);
      if (!originalResponse.ok) {
        return originalResponse;
      }

      // Get HTML and inject broker data
      let html = await originalResponse.text();
      const brokerData = await getBrokersForCountry(env.DB, countryCode);
      html = injectBrokerData(html, brokerData, countryCode);

      // Return modified response with proper cache headers
      return new Response(html, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=300', // 1 hour cache
          'X-Country-Code': countryCode,
          'X-Broker-Count': brokerData.length.toString(),
          'Vary': 'CF-IPCountry', // Cache varies by country
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Content-Type-Options': 'nosniff'
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      // On error, pass through to origin
      return fetch(request);
    }
  }
};

// Handle cache purge requests
async function handleCachePurge(request, url, env) {
  try {
    // Simple auth check (add your own auth token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${env.PURGE_TOKEN || 'your-secret-token'}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Since we're using Cloudflare's edge cache, we can't purge it from the worker
    // But we can return a success and rely on the API call from Laravel
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cache purge initiated. Use Cloudflare API for edge cache purge.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get brokers for specific country from database
async function getBrokersForCountry(database, countryCode) {
  try {
    // Query for country-specific brokers
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
    
    // Fallback to default brokers if no country-specific data
    console.log(`No data for ${countryCode}, using defaults`);
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

// Hardcoded fallback brokers (when DB is unavailable)
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

// Check if route should get dynamic broker data
async function checkDynamicRoute(database, pathname) {
  try {
    const decodedPath = decodeURIComponent(pathname);
    
    // Quick check for common broker routes
    const commonRoutes = [
      'شركات-تداول-مرخصة-في-السعودية',
      'منصات-تداول-العملات-الرقمية-في-الإمارات',
      'brokers',
      'trading-companies',
      'forex-brokers'
    ];
    
    for (const route of commonRoutes) {
      if (decodedPath.includes(route)) {
        return true;
      }
    }
    
    // Check database for additional routes
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
    return path.includes('شركات-تداول') || 
           path.includes('منصات-تداول') ||
           path.includes('broker') ||
           path.includes('trading');
  }
}

// Inject broker data into HTML
function injectBrokerData(html, brokers, countryCode) {
  const brokerPlaceholder = '<!-- BROKERS_PLACEHOLDER -->';
  
  if (!html.includes(brokerPlaceholder)) {
    console.warn('Broker placeholder not found in HTML');
    return html;
  }

  const brokerHtml = generateBrokerHtml(brokers, countryCode);
  return html.replace(brokerPlaceholder, brokerHtml);
}

// Generate broker HTML
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

// Get country name in Arabic
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
    'US': 'الولايات المتحدة',
    'GB': 'المملكة المتحدة',
    'DE': 'ألمانيا',
    'FR': 'فرنسا',
    'TR': 'تركيا'
  };
  
  return countryNames[countryCode] || 'منطقتك';
}