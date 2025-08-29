// Cloudflare Worker for Dynamic Broker Sorting
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Cache purge endpoint (for manual clearing when needed)
      if (url.pathname === '/__purge-cache' && request.method === 'POST') {
        return handleCachePurge(request, url, env);
      }
      
      // Skip processing for static assets
      if (isStaticAsset(url.pathname)) {
        return fetch(request);
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

      // Only process HTML responses
      const contentType = originalResponse.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        return originalResponse;
      }

      // Get HTML and inject broker data
      let html = await originalResponse.text();
      const brokerData = await getBrokersForCountry(env.DB, countryCode);
      const unsupportedBrokers = await getUnsupportedBrokers(env.DB, countryCode);
      html = injectBrokerData(html, brokerData, countryCode, unsupportedBrokers);
      
      console.log(`Processing ${url.pathname} for country ${countryCode}, found ${unsupportedBrokers.length} restrictions`);

      // Return modified response with proper cache headers
      return new Response(html, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=300', // 1 hour cache
          'X-Country-Code': countryCode,
          'X-Broker-Count': brokerData.length.toString(),
          'X-Unsupported-Count': unsupportedBrokers.length.toString(),
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

// Check if the request is for a static asset
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', 
    '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip', '.mp4', '.webm',
    '.webp', '.avif', '.map', '.xml', '.txt', '.json'
  ];
  
  const staticPaths = [
    '/_astro/', '/images/', '/assets/', '/static/', '/public/',
    '/favicon.', '/robots.txt', '/sitemap.xml', '/manifest.json'
  ];
  
  // Check file extensions
  const hasStaticExtension = staticExtensions.some(ext => 
    pathname.toLowerCase().endsWith(ext)
  );
  
  // Check static paths
  const isStaticPath = staticPaths.some(path => 
    pathname.toLowerCase().includes(path.toLowerCase())
  );
  
  return hasStaticExtension || isStaticPath;
}

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
    console.log(`No data for ${countryCode}, using defaults`);
    const defaultQuery = `
      SELECT b.id, b.name, b.logo, b.rating, b.min_deposit, b.description, 
             b.default_sort_order as sort_order, uc.restriction_type, uc.reason, uc.alternative_broker_id
      FROM brokers b
      LEFT JOIN unsupported_countries uc ON b.id = uc.broker_id AND uc.country_code = ? AND uc.is_active = 1
      WHERE b.is_active = 1
      ORDER BY b.default_sort_order ASC
      LIMIT 4
    `;
    
    const defaultResult = await database.prepare(defaultQuery).bind(countryCode).all();
    return defaultResult.results || getHardcodedBrokers();
    
  } catch (error) {
    console.error(`Database error for ${countryCode}:`, error);
    return getHardcodedBrokers();
  }
}

// Get unsupported brokers and their alternatives for a country
async function getUnsupportedBrokers(database, countryCode) {
  try {
    const query = `
      SELECT uc.broker_id, uc.company_id, uc.restriction_type, uc.reason, 
             b.name as broker_name, b.logo as broker_logo, b.company_id as broker_company_id,
             alt.id as alternative_id, alt.name as alternative_name, 
             alt.logo as alternative_logo, alt.website_url as alternative_url
      FROM unsupported_countries uc
      JOIN brokers b ON uc.broker_id = b.id
      LEFT JOIN brokers alt ON uc.alternative_broker_id = alt.id
      WHERE uc.country_code = ? AND uc.is_active = 1 AND b.is_active = 1
    `;
    
    const result = await database.prepare(query).bind(countryCode).all();
    return result.results || [];
    
  } catch (error) {
    console.error(`Error fetching unsupported brokers for ${countryCode}:`, error);
    return [];
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
      'reviews',
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
function injectBrokerData(html, brokers, countryCode, unsupportedBrokers = []) {
  try {
    // Safely stringify the data
    const safeUnsupportedBrokers = JSON.stringify(unsupportedBrokers || []);
    const safeCountryCode = countryCode.replace(/'/g, "\\'");
    const safeCountryName = getCountryName(countryCode).replace(/'/g, "\\'");
    
    // Inject country and unsupported brokers data as JavaScript variables
    const countryDataScript = `
    <script>
      window.USER_COUNTRY = '${safeCountryCode}';
      window.UNSUPPORTED_BROKERS = ${safeUnsupportedBrokers};
      window.COUNTRY_NAME = '${safeCountryName}';
      console.log('Worker data loaded for country:', '${safeCountryCode}');
    </script>
  `;
    
    // Inject the script before closing head tag
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

// Generate beginner broker table HTML
function generateBeginnerBrokerHtml(brokers, countryCode) {
  if (!brokers || brokers.length === 0) {
    return `
      <div style="text-align: center; padding: 2rem; color: #6b7280; background: #f9fafb; border-radius: 0.5rem;">
        <p>لا توجد شركات تداول متاحة حالياً في منطقتك.</p>
      </div>
    `;
  }

  let html = '<div class="beginner-table-grid">';
  html += '<div class="beginner-broker-table">';
  
  // Header
  html += `
    <div class="beginner-table-header">
      <div class="beginner-header-cell beginner-company-header">الشركة</div>
      <div class="beginner-header-cell">أقل مبلغ للإيداع</div>
      <div class="beginner-header-cell">التقييم</div>
    </div>
  `;
  
  // Broker rows - limit to top 4 for beginner table
  const topBrokers = brokers.slice(0, 4);
  
  topBrokers.forEach((broker, index) => {
    const minDeposit = broker.min_deposit || 0;
    const rating = broker.rating || 0;
    const logoColor = getBrokerLogoColor(broker.name);
    
    html += `
      <div class="beginner-broker-row" data-position="${index + 1}" data-broker-id="${broker.id}">
        <div class="beginner-broker-cell beginner-company-cell">
          <div class="beginner-company-info">
            <div class="beginner-company-logo" style="background: ${logoColor}; ${logoColor === '#fbbf24' ? 'color: #1f2937' : ''}">
              <span class="beginner-logo-text">${broker.name}</span>
            </div>
            <span class="beginner-company-name">${broker.name}</span>
          </div>
        </div>
        <div class="beginner-broker-cell">
          <span class="beginner-deposit-amount">${minDeposit}</span>
        </div>
        <div class="beginner-broker-cell">
          <span class="beginner-rating-value">${rating}/5</span>
        </div>
      </div>
    `;
  });
  
  // Footer
  html += `
    <div class="beginner-table-footer">
      <div class="beginner-footer-content">
        <span class="beginner-footer-icon">⚡</span>
        <span class="beginner-footer-text">أفضل شركات التداول للمبتدئين</span>
      </div>
    </div>
  `;
  
  html += '</div></div>';
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