// Enhanced Cloudflare Worker with improved caching strategies
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const userCountry = request.cf?.country || 'US';
      const cacheKey = `broker-data-${userCountry}-v2`;
      
      // Enhanced cache purge endpoint
      if (url.pathname === '/__purge-cache' && request.method === 'POST') {
        return handleCachePurge(request, url, env);
      }
      
      // Skip processing for static assets with enhanced detection
      if (isStaticAsset(url.pathname)) {
        return fetch(request);
      }
      
      // Check if this route should get dynamic broker data
      const shouldProcess = await checkDynamicRoute(env.DB, url.pathname);
      
      if (!shouldProcess) {
        return fetch(request);
      }

      // Try to get cached broker data first
      let brokerData = await getCachedBrokerData(env.CACHE, cacheKey);
      let unsupportedBrokers = [];
      
      if (!brokerData) {
        // Fetch fresh data and cache it
        [brokerData, unsupportedBrokers] = await Promise.all([
          getBrokersForCountry(env.DB, userCountry),
          getUnsupportedBrokers(env.DB, userCountry)
        ]);
        
        // Cache the broker data for 30 minutes
        await cacheBrokerData(env.CACHE, cacheKey, { brokerData, unsupportedBrokers });
      } else {
        unsupportedBrokers = brokerData.unsupportedBrokers || [];
        brokerData = brokerData.brokerData || [];
      }

      // Fetch original page with edge caching
      const cacheKeyForPage = `page-${url.pathname}-${userCountry}`;
      let response = await env.CACHE?.get(cacheKeyForPage, { type: 'stream' });
      
      if (!response) {
        const originalResponse = await fetch(request);
        if (!originalResponse.ok) {
          return originalResponse;
        }
        
        // Store in cache for 1 hour
        ctx.waitUntil(env.CACHE?.put(cacheKeyForPage, originalResponse.clone(), {
          expirationTtl: 3600 // 1 hour
        }));
        
        response = originalResponse;
      }

      // Only process HTML responses
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        return response;
      }

      // Get HTML and inject broker data
      let html = await response.text();
      html = injectBrokerData(html, brokerData, userCountry, unsupportedBrokers);
      
      console.log(`Processing ${url.pathname} for country ${userCountry}, found ${unsupportedBrokers.length} restrictions`);

      // Return with enhanced cache headers
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=300',
          'X-Country-Code': userCountry,
          'X-Broker-Count': brokerData.length.toString(),
          'X-Unsupported-Count': unsupportedBrokers.length.toString(),
          'X-Cache-Key': cacheKey,
          'Vary': 'CF-IPCountry',
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Content-Type-Options': 'nosniff',
          'Last-Modified': new Date().toUTCString(),
          'ETag': `"${generateETag(brokerData, userCountry)}"`
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      // Enhanced error handling with fallback
      return createErrorResponse(error, request);
    }
  }
};

// Enhanced caching functions
async function getCachedBrokerData(cache, key) {
  try {
    if (!cache) return null;
    
    const cached = await cache.get(key, { type: 'json' });
    if (cached && cached.timestamp && (Date.now() - cached.timestamp < 1800000)) { // 30 min
      return cached.data;
    }
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function cacheBrokerData(cache, key, data) {
  try {
    if (!cache) return;
    
    await cache.put(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }), {
      expirationTtl: 1800 // 30 minutes
    });
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// Enhanced static asset detection
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', 
    '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip', '.mp4', '.webm',
    '.webp', '.avif', '.map', '.xml', '.txt', '.json', '.wasm'
  ];
  
  const staticPaths = [
    '/_astro/', '/images/', '/assets/', '/static/', '/public/',
    '/favicon.', '/robots.txt', '/sitemap.xml', '/manifest.json',
    '/.well-known/', '/sw.js', '/workbox-'
  ];
  
  const lowerPath = pathname.toLowerCase();
  
  return staticExtensions.some(ext => lowerPath.endsWith(ext)) ||
         staticPaths.some(path => lowerPath.includes(path.toLowerCase()));
}

// Enhanced error response
function createErrorResponse(error, originalRequest) {
  const isHTMLRequest = originalRequest.headers.get('accept')?.includes('text/html');
  
  if (isHTMLRequest) {
    return new Response(`
      <html>
        <head><title>خطأ مؤقت</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 2rem;">
          <h1>خطأ مؤقت في الخدمة</h1>
          <p>نعتذر عن الإزعاج، يرجى المحاولة مرة أخرى خلال بضع دقائق.</p>
          <button onclick="location.reload()">إعادة المحاولة</button>
        </body>
      </html>
    `, {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  return new Response(JSON.stringify({
    error: 'Service temporarily unavailable',
    message: 'يرجى المحاولة مرة أخرى لاحقاً'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Generate ETag for cache validation
function generateETag(brokerData, country) {
  const content = JSON.stringify({ brokerData, country, timestamp: Math.floor(Date.now() / 1800000) });
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Enhanced cache purge with multiple cache layers
async function handleCachePurge(request, url, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${env.PURGE_TOKEN}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json().catch(() => ({}));
    const { pattern = '*', country = null } = body;

    // Purge broker data cache
    if (env.CACHE) {
      if (country) {
        await env.CACHE.delete(`broker-data-${country}-v2`);
      } else {
        // Purge all country-specific cache keys
        const countries = ['US', 'GB', 'DE', 'SA', 'AE', 'EG', 'TH', 'FR', 'IT', 'ES'];
        await Promise.all(countries.map(c => 
          env.CACHE.delete(`broker-data-${c}-v2`)
        ));
      }
      
      // Purge page cache
      if (pattern !== '*') {
        await env.CACHE.delete(`page-${pattern}-${country || 'US'}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cache purged successfully',
      purged_pattern: pattern,
      purged_country: country || 'all'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Check if route should get dynamic processing
async function checkDynamicRoute(database, pathname) {
  try {
    // Always process if no database
    if (!database) return true;
    
    // Check if path matches dynamic routes
    const query = `SELECT 1 FROM dynamic_routes WHERE route_pattern = ? OR ? LIKE route_pattern LIMIT 1`;
    const result = await database.prepare(query).bind(pathname, pathname).first();
    
    return !!result;
  } catch (error) {
    console.error('Error checking dynamic route:', error);
    // Default to processing if error
    return true;
  }
}

// Get brokers for specific country from database
async function getBrokersForCountry(database, countryCode) {
  try {
    // Query for country-specific brokers with restriction info
    const query = `
      SELECT b.id, b.name, b.logo, b.rating, b.min_deposit, b.description, 
             cs.sort_order, uc.restriction_type, uc.reason, uc.alternative_broker_id
      FROM brokers b
      JOIN country_sorting cs ON b.id = cs.broker_id
      LEFT JOIN unsupported_countries uc ON b.id = uc.broker_id AND uc.country_code = ? AND uc.is_active = 1
      WHERE cs.country_code = ? AND b.is_active = 1
      ORDER BY cs.sort_order ASC
      LIMIT 6
    `;
    
    const result = await database.prepare(query).bind(countryCode, countryCode).all();
    
    if (result.results && result.results.length > 0) {
      return result.results;
    }
    
    // Fallback to default brokers if no country-specific data
    return getDefaultBrokers();
    
  } catch (error) {
    console.error('Database error:', error);
    return getHardcodedBrokers();
  }
}

// Get unsupported brokers for specific country
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
    console.error('Error fetching unsupported brokers:', error);
    return [];
  }
}

// Get default brokers when no country-specific data
function getDefaultBrokers() {
  return [
    { id: 1, name: 'Exness', rating: 4.5, min_deposit: 10, logo: '', description: 'وسيط موثوق' },
    { id: 2, name: 'XTB', rating: 4.0, min_deposit: 100, logo: '', description: 'وسيط منظم' },
    { id: 3, name: 'AvaTrade', rating: 4.0, min_deposit: 100, logo: '', description: 'وسيط عالمي' },
    { id: 4, name: 'Evest', rating: 4.5, min_deposit: 50, logo: '', description: 'وسيط متقدم' }
  ];
}

// Hardcoded fallback brokers
function getHardcodedBrokers() {
  return [
    { id: 1, name: 'Exness', rating: 4.5, min_deposit: 10, logo: '', description: 'وسيط موثوق للتداول' },
    { id: 2, name: 'XTB', rating: 4.0, min_deposit: 100, logo: '', description: 'وسيط منظم ومرخص' },
    { id: 3, name: 'AvaTrade', rating: 4.0, min_deposit: 100, logo: '', description: 'وسيط عالمي موثوق' },
    { id: 4, name: 'Evest', rating: 4.5, min_deposit: 50, logo: '', description: 'وسيط متقدم ومبتكر' }
  ];
}

// Inject broker data into HTML
function injectBrokerData(html, brokers, countryCode, unsupportedBrokers = []) {
  try {
    // Create country data script
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
      </script>
    `;
    
    // Try to inject in head, otherwise before closing body
    if (html.includes('</head>')) {
      html = html.replace('</head>', countryDataScript + '</head>');
    } else {
      // Fallback: inject at the beginning of body
      html = html.replace('<body>', '<body>' + countryDataScript);
    }
    
    // Handle broker placeholder if it exists
    const brokerPlaceholder = '<!-- BROKERS_PLACEHOLDER -->';
    if (html.includes(brokerPlaceholder)) {
      const brokerHtml = generateBrokerHtml(brokers, countryCode);
      html = html.replace(brokerPlaceholder, brokerHtml);
    }

    // Handle beginner brokers placeholder if it exists
    const beginnerPlaceholder = '<!-- BEGINNER_BROKERS_PLACEHOLDER -->';
    if (html.includes(beginnerPlaceholder)) {
      const beginnerHtml = generateBeginnerBrokerHtml(brokers, countryCode);
      html = html.replace(beginnerPlaceholder, beginnerHtml);
    }

    // Handle [beginner-57] placeholder directly
    if (html.includes('[beginner-57]')) {
      const beginnerHtml = generateBeginnerBrokerHtml(brokers, countryCode);
      html = html.replace(/\[beginner-57\]/g, beginnerHtml);
    }
    
    return html;
  } catch (error) {
    console.error('Error injecting broker data:', error);
    return html;
  }
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

  let html = '<div class="companies-grid">';
  
  brokers.forEach((broker, index) => {
    const minDeposit = broker.min_deposit || 0;
    const rating = broker.rating || 0;
    const description = broker.description || 'وسيط موثوق للتداول';
    const logoColor = getBrokerLogoColor(broker.name);
    
    // Generate star icons
    const starsHtml = Array(4).fill().map(() => `
      <svg class="company-star" width="16" height="16" viewBox="0 0 24 24" fill="#2563eb">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    `).join('');
    
    html += `
      <article class="company-card" data-position="${index + 1}" data-broker-id="${broker.id}">
        <div class="company-logo">
          <div class="company-logo-container" style="background: ${logoColor};">
            <span class="broker-name">${broker.name}</span>
          </div>
        </div>
        <div class="company-info">
          <div class="company-rating">
            <div class="company-stars">
              ${starsHtml}
            </div>
          </div>
          <div class="company-license">
            <div class="company-license-label">التراخيص</div>
            <div class="company-license-value">FCA</div>
          </div>
          <div class="company-details">
            <div class="company-min-deposit">أقل مبلغ للإيداع</div>
            <div class="company-deposit-amount">${minDeposit}</div>
          </div>
        </div>
        <button class="company-open-account-btn">فتح حساب</button>
      </article>
    `;
  });
  
  html += '</div>';
  return html;
}

// Generate beginner broker HTML table
function generateBeginnerBrokerHtml(brokers, countryCode) {
  if (!brokers || brokers.length === 0) {
    return `
      <div style="text-align: center; padding: 2rem; color: #6b7280; background: #f9fafb; border-radius: 0.5rem;">
        <p>لا توجد شركات تداول متاحة حالياً في منطقتك.</p>
      </div>
    `;
  }

  let html = '<div class="broker-table-wrapper">';
  html += '<table class="broker-table">';
  
  // Header
  html += `
    <thead>
      <tr class="table-header">
        <th class="header-cell company-header">الشركة</th>
        <th class="header-cell deposit-header">أقل مبلغ للإيداع</th>
        <th class="header-cell rating-header">التقييم</th>
      </tr>
    </thead>
  `;
  
  // Broker rows - limit to top 4 for beginner table
  const topBrokers = brokers.slice(0, 4);
  html += '<tbody>';
  
  topBrokers.forEach((broker, index) => {
    const minDeposit = broker.min_deposit || 0;
    const rating = broker.rating || 0;
    const logoColor = getBrokerLogoColor(broker.name);
    
    html += `
      <tr class="broker-row" data-position="${index + 1}" data-broker-id="${broker.id}">
        <td class="broker-cell company-cell">
          <div class="company-info">
            <div class="company-logo" style="background: ${logoColor}; ${logoColor === '#fbbf24' ? 'color: #1f2937' : ''}">
              <span class="logo-text">${broker.name}</span>
            </div>
            <span class="company-name">${broker.name}</span>
          </div>
        </td>
        <td class="broker-cell deposit-cell">
          <span class="deposit-amount">${minDeposit}</span>
        </td>
        <td class="broker-cell rating-cell">
          <span class="rating-value">${rating}/5</span>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody>';
  
  // Footer
  html += `
    <tfoot>
      <tr>
        <td colspan="3" class="table-footer">
          <div class="footer-content">
            <span class="footer-icon">⚡</span>
            <span class="footer-text">أفضل شركات التداول للمبتدئين</span>
          </div>
        </td>
      </tr>
    </tfoot>
  `;
  
  html += '</table></div>';
  return html;
}

// Get broker logo color based on name
function getBrokerLogoColor(name) {
  const colors = {
    'exness': '#fbbf24',
    'evest': '#1e40af', 
    'xtb': '#dc2626',
    'avatrade': '#4f46e5',
    'default': '#6366f1'
  };
  
  const lowerName = name.toLowerCase();
  return colors[lowerName] || colors.default;
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
    'MA': 'المغرب',
    'TN': 'تونس',
    'DZ': 'الجزائر',
    'IQ': 'العراق',
    'SY': 'سوريا',
    'YE': 'اليمن',
    'LY': 'ليبيا',
    'SD': 'السودان',
    'US': 'الولايات المتحدة',
    'GB': 'المملكة المتحدة',
    'DE': 'ألمانيا',
    'FR': 'فرنسا',
    'IT': 'إيطاليا',
    'ES': 'إسبانيا',
    'TH': 'تايلاند'
  };
  
  return countryNames[countryCode] || 'بلدك';
}