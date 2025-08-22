-- D1 Database Schema for Dynamic Broker Sorting

-- Table for storing broker information
CREATE TABLE brokers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo TEXT,
    rating REAL DEFAULT 0,
    min_deposit INTEGER DEFAULT 0,
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

-- Index for faster queries
CREATE INDEX idx_country_sorting ON country_sorting(country_code, sort_order);
CREATE INDEX idx_brokers_active ON brokers(is_active, default_sort_order);

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