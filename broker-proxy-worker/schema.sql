-- D1 Database Schema for Dynamic Broker Sorting

-- Table for storing broker information
CREATE TABLE brokers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo TEXT,
    rating REAL DEFAULT 0,
    min_deposit INTEGER DEFAULT 0,
    company_id INTEGER,
    description TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    default_sort_order INTEGER DEFAULT 999,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for country-specific broker sorting
CREATE TABLE country_sorting (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code TEXT NOT NULL,
    broker_id INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    is_featured BOOLEAN DEFAULT 0,
    custom_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES brokers (id) ON DELETE CASCADE,
    UNIQUE(country_code, broker_id)
);

-- Table for dynamic routes that should get broker data
CREATE TABLE dynamic_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_pattern TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for countries that don't support specific brokers
CREATE TABLE unsupported_countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    broker_id INTEGER NOT NULL,
    company_id INTEGER,
    country_code TEXT NOT NULL,
    country_name TEXT,
    restriction_type TEXT DEFAULT 'blocked', -- 'blocked', 'restricted', 'unavailable'
    reason TEXT, -- reason for restriction (e.g., 'regulatory', 'license', 'policy')
    alternative_broker_id INTEGER, -- suggested alternative broker
    redirect_url TEXT, -- specific redirect URL for this country
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES brokers (id) ON DELETE CASCADE,
    FOREIGN KEY (alternative_broker_id) REFERENCES brokers (id) ON DELETE SET NULL,
    UNIQUE(broker_id, country_code)
);

-- Index for faster queries
CREATE INDEX idx_country_sorting ON country_sorting(country_code, sort_order);
CREATE INDEX idx_brokers_active ON brokers(is_active, default_sort_order);
CREATE INDEX idx_dynamic_routes ON dynamic_routes(is_active);
CREATE INDEX idx_unsupported_countries ON unsupported_countries(broker_id, country_code, is_active);

-- Sample broker data
INSERT INTO brokers (name, slug, logo, rating, min_deposit, description, website_url, default_sort_order) VALUES
('eVest', 'evest', '/images/brokers/evest-logo.png', 4.2, 250, 'Multi-regulated broker with competitive spreads', 'https://evest.com', 1),
('Exness', 'exness', '/images/brokers/exness-logo.png', 4.5, 10, 'Popular broker with low minimum deposit', 'https://exness.com', 2),
('AvaTrade', 'avatrade', '/images/brokers/avatrade-logo.png', 4.1, 100, 'Well-established broker with strong regulation', 'https://avatrade.com', 3),
('XTB', 'xtb', '/images/brokers/xtb-logo.png', 4.3, 250, 'European broker with excellent trading platform', 'https://xtb.com', 4);

-- Sample country-specific sorting
-- For United States (US)
INSERT INTO country_sorting (country_code, broker_id, sort_order, is_featured) VALUES
('US', 1, 1, 1), -- eVest first
('US', 3, 2, 1), -- AvaTrade second  
('US', 4, 3, 0), -- XTB third
('US', 2, 4, 0); -- Exness last

-- For United Kingdom (GB)
INSERT INTO country_sorting (country_code, broker_id, sort_order, is_featured) VALUES
('GB', 4, 1, 1), -- XTB first (European broker)
('GB', 3, 2, 1), -- AvaTrade second
('GB', 1, 3, 0), -- eVest third
('GB', 2, 4, 0); -- Exness last

-- For Germany (DE)
INSERT INTO country_sorting (country_code, broker_id, sort_order, is_featured) VALUES
('DE', 4, 1, 1), -- XTB first (European focus)
('DE', 1, 2, 1), -- eVest second
('DE', 3, 3, 0), -- AvaTrade third
('DE', 2, 4, 0); -- Exness last

-- For Asian countries (example: Singapore - SG)
INSERT INTO country_sorting (country_code, broker_id, sort_order, is_featured) VALUES
('SG', 2, 1, 1), -- Exness first (popular in Asia)
('SG', 1, 2, 1), -- eVest second
('SG', 3, 3, 0), -- AvaTrade third
('SG', 4, 4, 0); -- XTB last

-- Sample dynamic routes
INSERT INTO dynamic_routes (route_pattern) VALUES
('شركات-تداول-مرخصة-في-السعودية'),
('brokers'),
('trading-companies'),
('forex-brokers'),
('وسطاء-تداول'),
('شركات-الفوركس'),
('وسطاء-فوركس'),
('شركات-وساطة'),
('best-brokers'),
('top-brokers'),
('%D8%B4%D8%B1%D9%83%D8%A7%D8%AA'), -- URL encoded Arabic
('%D9%88%D8%B3%D8%B7%D8%A7%D8%A1'), -- URL encoded Arabic for "brokers"
('broker-comparison'),
('trading-platforms');

-- Sample unsupported countries data
-- eVest not supported in these countries
INSERT INTO unsupported_countries (broker_id, country_code, country_name, restriction_type, reason, alternative_broker_id) VALUES
(1, 'US', 'United States', 'blocked', 'regulatory', 2), -- eVest blocked in US, suggest Exness
(1, 'CA', 'Canada', 'blocked', 'regulatory', 3), -- eVest blocked in Canada, suggest AvaTrade
(1, 'IR', 'Iran', 'blocked', 'sanctions', 2), -- eVest blocked in Iran, suggest Exness
(1, 'SY', 'Syria', 'blocked', 'sanctions', 2), -- eVest blocked in Syria, suggest Exness

-- Exness restrictions
(2, 'US', 'United States', 'blocked', 'regulatory', 3), -- Exness blocked in US, suggest AvaTrade
(2, 'BE', 'Belgium', 'restricted', 'regulatory', 4), -- Exness restricted in Belgium, suggest XTB

-- AvaTrade restrictions  
(3, 'TR', 'Turkey', 'unavailable', 'license', 2), -- AvaTrade unavailable in Turkey, suggest Exness
(3, 'CN', 'China', 'blocked', 'regulatory', 2), -- AvaTrade blocked in China, suggest Exness

-- XTB restrictions
(4, 'MY', 'Malaysia', 'restricted', 'regulatory', 2), -- XTB restricted in Malaysia, suggest Exness
(4, 'ID', 'Indonesia', 'unavailable', 'license', 1); -- XTB unavailable in Indonesia, suggest eVest

-- Query examples for testing:

-- Get brokers for US users
-- SELECT b.*, cs.sort_order, cs.is_featured 
-- FROM brokers b 
-- JOIN country_sorting cs ON b.id = cs.broker_id 
-- WHERE cs.country_code = 'US' 
-- ORDER BY cs.sort_order ASC;

-- Get brokers for UK users  
-- SELECT b.*, cs.sort_order, cs.is_featured 
-- FROM brokers b 
-- JOIN country_sorting cs ON b.id = cs.broker_id 
-- WHERE cs.country_code = 'GB' 
-- ORDER BY cs.sort_order ASC;

-- Check if a broker is supported in a specific country
-- SELECT b.name, uc.restriction_type, uc.reason, alt.name as alternative_broker
-- FROM brokers b
-- LEFT JOIN unsupported_countries uc ON b.id = uc.broker_id AND uc.country_code = 'US'
-- LEFT JOIN brokers alt ON uc.alternative_broker_id = alt.id
-- WHERE b.id = 1; -- Check eVest for US

-- Get all unsupported brokers for a country with alternatives
-- SELECT b.name as blocked_broker, uc.restriction_type, uc.reason, 
--        alt.name as suggested_alternative, uc.redirect_url
-- FROM unsupported_countries uc
-- JOIN brokers b ON uc.broker_id = b.id
-- LEFT JOIN brokers alt ON uc.alternative_broker_id = alt.id
-- WHERE uc.country_code = 'US' AND uc.is_active = 1;

-- Get available brokers for a country (excluding unsupported ones)
-- SELECT DISTINCT b.*
-- FROM brokers b
-- LEFT JOIN unsupported_countries uc ON b.id = uc.broker_id AND uc.country_code = 'US'
-- WHERE b.is_active = 1 AND uc.id IS NULL
-- ORDER BY b.default_sort_order;

-- Get country-specific broker list with restrictions
-- SELECT b.*, cs.sort_order, cs.is_featured,
--        CASE WHEN uc.id IS NOT NULL THEN 1 ELSE 0 END as is_restricted,
--        uc.restriction_type, uc.reason, alt.name as alternative_broker
-- FROM brokers b
-- LEFT JOIN country_sorting cs ON b.id = cs.broker_id AND cs.country_code = 'US'
-- LEFT JOIN unsupported_countries uc ON b.id = uc.broker_id AND uc.country_code = 'US'
-- LEFT JOIN brokers alt ON uc.alternative_broker_id = alt.id
-- WHERE b.is_active = 1
-- ORDER BY COALESCE(cs.sort_order, b.default_sort_order);