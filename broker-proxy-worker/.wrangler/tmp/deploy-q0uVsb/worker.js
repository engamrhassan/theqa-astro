var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var worker_default = {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/__purge-cache" && request.method === "POST") {
        return handleCachePurge(request, url, env);
      }
      if (isStaticAsset(url.pathname)) {
        return fetch(request);
      }
      const countryCode = request.cf?.country || "US";
      const shouldProcess = await checkDynamicRoute(env.DB, url.pathname);
      if (!shouldProcess) {
        return fetch(request);
      }
      const originalResponse = await fetch(request);
      if (!originalResponse.ok) {
        return originalResponse;
      }
      const contentType = originalResponse.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        return originalResponse;
      }
      let html = await originalResponse.text();
      const brokerData = await getBrokersForCountry(env.DB, countryCode);
      const unsupportedBrokers = await getUnsupportedBrokers(env.DB, countryCode);
      html = injectBrokerData(html, brokerData, countryCode, unsupportedBrokers);
      console.log(`Processing ${url.pathname} for country ${countryCode}, found ${unsupportedBrokers.length} restrictions`);
      return new Response(html, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=300",
          // 1 hour cache
          "X-Country-Code": countryCode,
          "X-Broker-Count": brokerData.length.toString(),
          "X-Unsupported-Count": unsupportedBrokers.length.toString(),
          "Vary": "CF-IPCountry",
          // Cache varies by country
          "X-Frame-Options": "SAMEORIGIN",
          "X-Content-Type-Options": "nosniff"
        }
      });
    } catch (error) {
      console.error("Worker error:", error);
      return fetch(request);
    }
  }
};
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
    ".json"
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
    "/manifest.json"
  ];
  const hasStaticExtension = staticExtensions.some(
    (ext) => pathname.toLowerCase().endsWith(ext)
  );
  const isStaticPath = staticPaths.some(
    (path) => pathname.toLowerCase().includes(path.toLowerCase())
  );
  return hasStaticExtension || isStaticPath;
}
__name(isStaticAsset, "isStaticAsset");
async function handleCachePurge(request, url, env) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.PURGE_TOKEN || "your-secret-token"}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Cache purge initiated. Use Cloudflare API for edge cache purge."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleCachePurge, "handleCachePurge");
async function getBrokersForCountry(database, countryCode) {
  try {
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
__name(getBrokersForCountry, "getBrokersForCountry");
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
__name(getUnsupportedBrokers, "getUnsupportedBrokers");
function getHardcodedBrokers() {
  return [
    {
      id: 1,
      name: "eVest",
      rating: 4.2,
      min_deposit: 250,
      description: "\u0648\u0633\u064A\u0637 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u0645\u0639 \u0641\u0631\u0648\u0642 \u0623\u0633\u0639\u0627\u0631 \u062A\u0646\u0627\u0641\u0633\u064A\u0629",
      sort_order: 1
    },
    {
      id: 2,
      name: "Exness",
      rating: 4.5,
      min_deposit: 10,
      description: "\u0648\u0633\u064A\u0637 \u0634\u0647\u064A\u0631 \u0645\u0639 \u062D\u062F \u0623\u062F\u0646\u0649 \u0645\u0646\u062E\u0641\u0636 \u0644\u0644\u0625\u064A\u062F\u0627\u0639",
      sort_order: 2
    },
    {
      id: 3,
      name: "AvaTrade",
      rating: 4.1,
      min_deposit: 100,
      description: "\u0648\u0633\u064A\u0637 \u0631\u0627\u0633\u062E \u0645\u0639 \u062A\u0646\u0638\u064A\u0645 \u0642\u0648\u064A",
      sort_order: 3
    }
  ];
}
__name(getHardcodedBrokers, "getHardcodedBrokers");
async function checkDynamicRoute(database, pathname) {
  try {
    const decodedPath = decodeURIComponent(pathname);
    const commonRoutes = [
      "\u0634\u0631\u0643\u0627\u062A-\u062A\u062F\u0627\u0648\u0644-\u0645\u0631\u062E\u0635\u0629-\u0641\u064A-\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629",
      "\u0645\u0646\u0635\u0627\u062A-\u062A\u062F\u0627\u0648\u0644-\u0627\u0644\u0639\u0645\u0644\u0627\u062A-\u0627\u0644\u0631\u0642\u0645\u064A\u0629-\u0641\u064A-\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A",
      "reviews",
      "brokers",
      "trading-companies",
      "forex-brokers"
    ];
    for (const route of commonRoutes) {
      if (decodedPath.includes(route)) {
        return true;
      }
    }
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
    console.error("Route check error:", error);
    const path = decodeURIComponent(pathname).toLowerCase();
    return path.includes("\u0634\u0631\u0643\u0627\u062A-\u062A\u062F\u0627\u0648\u0644") || path.includes("\u0645\u0646\u0635\u0627\u062A-\u062A\u062F\u0627\u0648\u0644") || path.includes("broker") || path.includes("trading");
  }
}
__name(checkDynamicRoute, "checkDynamicRoute");
function injectBrokerData(html, brokers, countryCode, unsupportedBrokers = []) {
  try {
    const safeUnsupportedBrokers = JSON.stringify(unsupportedBrokers || []);
    const safeCountryCode = countryCode.replace(/'/g, "\\'");
    const safeCountryName = getCountryName(countryCode).replace(/'/g, "\\'");
    const countryDataScript = `
    <script>
      window.USER_COUNTRY = '${safeCountryCode}';
      window.UNSUPPORTED_BROKERS = ${safeUnsupportedBrokers};
      window.COUNTRY_NAME = '${safeCountryName}';
      console.log('Worker data loaded for country:', '${safeCountryCode}');
    <\/script>
  `;
    if (html.includes("</head>")) {
      html = html.replace("</head>", countryDataScript + "</head>");
    } else {
      html = html.replace("<body>", "<body>" + countryDataScript);
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
    return html;
  } catch (error) {
    console.error("Error injecting broker data:", error);
    return html;
  }
}
__name(injectBrokerData, "injectBrokerData");
function generateBrokerHtml(brokers, countryCode) {
  if (!brokers || brokers.length === 0) {
    return `
      <div style="text-align: center; padding: 2rem; color: #6b7280; background: #f9fafb; border-radius: 0.5rem;">
        <p>\u0644\u0627 \u062A\u0648\u062C\u062F \u0634\u0631\u0643\u0627\u062A \u062A\u062F\u0627\u0648\u0644 \u0645\u062A\u0627\u062D\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u0645\u0646\u0637\u0642\u062A\u0643.</p>
      </div>
    `;
  }
  let html = '<div class="companies-grid">';
  brokers.forEach((broker, index) => {
    const minDeposit = broker.min_deposit || 0;
    const rating = broker.rating || 0;
    const description = broker.description || "\u0648\u0633\u064A\u0637 \u0645\u0648\u062B\u0648\u0642 \u0644\u0644\u062A\u062F\u0627\u0648\u0644";
    const logoColor = getBrokerLogoColor(broker.name);
    const starsHtml = Array(4).fill().map(() => `
      <svg class="company-star" width="16" height="16" viewBox="0 0 24 24" fill="#2563eb">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    `).join("");
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
            <div class="company-license-label">\u0627\u0644\u062A\u0631\u0627\u062E\u064A\u0635</div>
            <div class="company-license-value">FCA</div>
          </div>
          <div class="company-details">
            <div class="company-min-deposit">\u0623\u0642\u0644 \u0645\u0628\u0644\u063A \u0644\u0644\u0625\u064A\u062F\u0627\u0639</div>
            <div class="company-deposit-amount">${minDeposit}</div>
          </div>
        </div>
        <button class="company-open-account-btn">\u0641\u062A\u062D \u062D\u0633\u0627\u0628</button>
      </article>
    `;
  });
  html += "</div>";
  return html;
}
__name(generateBrokerHtml, "generateBrokerHtml");
function getBrokerLogoColor(name) {
  const colors = {
    "exness": "#fbbf24",
    "evest": "#1e40af",
    "xtb": "#dc2626",
    "avatrade": "#4f46e5",
    "default": "#6366f1"
  };
  const lowerName = name.toLowerCase();
  return colors[lowerName] || colors.default;
}
__name(getBrokerLogoColor, "getBrokerLogoColor");
function generateBeginnerBrokerHtml(brokers, countryCode) {
  if (!brokers || brokers.length === 0) {
    return `
      <div style="text-align: center; padding: 2rem; color: #6b7280; background: #f9fafb; border-radius: 0.5rem;">
        <p>\u0644\u0627 \u062A\u0648\u062C\u062F \u0634\u0631\u0643\u0627\u062A \u062A\u062F\u0627\u0648\u0644 \u0645\u062A\u0627\u062D\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u0645\u0646\u0637\u0642\u062A\u0643.</p>
      </div>
    `;
  }
  let html = '<div class="broker-table-wrapper">';
  html += '<table class="broker-table">';
  html += `
    <thead>
      <tr class="table-header">
        <th class="header-cell company-header">\u0627\u0644\u0634\u0631\u0643\u0629</th>
        <th class="header-cell deposit-header">\u0623\u0642\u0644 \u0645\u0628\u0644\u063A \u0644\u0644\u0625\u064A\u062F\u0627\u0639</th>
        <th class="header-cell rating-header">\u0627\u0644\u062A\u0642\u064A\u064A\u0645</th>
      </tr>
    </thead>
  `;
  const topBrokers = brokers.slice(0, 4);
  html += "<tbody>";
  topBrokers.forEach((broker, index) => {
    const minDeposit = broker.min_deposit || 0;
    const rating = broker.rating || 0;
    const logoColor = getBrokerLogoColor(broker.name);
    html += `
      <tr class="broker-row" data-position="${index + 1}" data-broker-id="${broker.id}">
        <td class="broker-cell company-cell">
          <div class="company-info">
            <div class="company-logo" style="background: ${logoColor}; ${logoColor === "#fbbf24" ? "color: #1f2937" : ""}">
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
  html += "</tbody>";
  html += `
    <tfoot>
      <tr>
        <td colspan="3" class="table-footer">
          <div class="footer-content">
            <span class="footer-icon">\u26A1</span>
            <span class="footer-text">\u0623\u0641\u0636\u0644 \u0634\u0631\u0643\u0627\u062A \u0627\u0644\u062A\u062F\u0627\u0648\u0644 \u0644\u0644\u0645\u0628\u062A\u062F\u0626\u064A\u0646</span>
          </div>
        </td>
      </tr>
    </tfoot>
  `;
  html += "</table></div>";
  return html;
}
__name(generateBeginnerBrokerHtml, "generateBeginnerBrokerHtml");
function getCountryName(countryCode = "SA") {
  const countryNames = {
    "SA": "\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629",
    "AE": "\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A",
    "KW": "\u0627\u0644\u0643\u0648\u064A\u062A",
    "BH": "\u0627\u0644\u0628\u062D\u0631\u064A\u0646",
    "QA": "\u0642\u0637\u0631",
    "OM": "\u0639\u0645\u0627\u0646",
    "JO": "\u0627\u0644\u0623\u0631\u062F\u0646",
    "LB": "\u0644\u0628\u0646\u0627\u0646",
    "EG": "\u0645\u0635\u0631",
    "IQ": "\u0627\u0644\u0639\u0631\u0627\u0642",
    "US": "\u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0627\u0644\u0645\u062A\u062D\u062F\u0629",
    "GB": "\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629",
    "DE": "\u0623\u0644\u0645\u0627\u0646\u064A\u0627",
    "FR": "\u0641\u0631\u0646\u0633\u0627",
    "TR": "\u062A\u0631\u0643\u064A\u0627"
  };
  return countryNames[countryCode] || "\u0645\u0646\u0637\u0642\u062A\u0643";
}
__name(getCountryName, "getCountryName");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
