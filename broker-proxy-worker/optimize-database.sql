-- DATABASE OPTIMIZATION SCRIPT
-- Run this script to add performance indexes to your D1 database

-- =============================================================================
-- PERFORMANCE INDEXES FOR QUERY OPTIMIZATION
-- =============================================================================

-- 1. Enhanced index for dynamic routes (critical for route checking)
CREATE INDEX IF NOT EXISTS idx_dynamic_routes_active_pattern 
ON dynamic_routes(is_active, route_pattern);

-- 2. Optimized index for brokers table
CREATE INDEX IF NOT EXISTS idx_brokers_active_sort 
ON brokers(is_active, default_sort_order, id);

-- 3. Enhanced index for country sorting
CREATE INDEX IF NOT EXISTS idx_country_sorting_optimized 
ON country_sorting(country_code, sort_order, broker_id);

-- 4. Optimized index for unsupported countries
CREATE INDEX IF NOT EXISTS idx_unsupported_optimized 
ON unsupported_countries(country_code, is_active, broker_id);

-- 5. Composite index for broker JOINs
CREATE INDEX IF NOT EXISTS idx_brokers_id_active 
ON brokers(id, is_active);

-- 6. Index for alternative broker lookups
CREATE INDEX IF NOT EXISTS idx_unsupported_alternative 
ON unsupported_countries(alternative_broker_id, is_active);

-- =============================================================================
-- ANALYZE TABLES FOR BETTER QUERY PLANNING
-- =============================================================================

-- Update statistics for query optimizer
ANALYZE brokers;
ANALYZE country_sorting;
ANALYZE dynamic_routes;
ANALYZE unsupported_countries;

-- =============================================================================
-- VERIFY INDEXES WERE CREATED
-- =============================================================================

-- Check all indexes on our tables
SELECT 
    tbl_name as table_name,
    name as index_name,
    sql as index_definition
FROM sqlite_master 
WHERE type = 'index' 
  AND tbl_name IN ('brokers', 'country_sorting', 'dynamic_routes', 'unsupported_countries')
  AND name NOT LIKE 'sqlite_%'
ORDER BY tbl_name, name;

-- =============================================================================
-- PERFORMANCE TEST QUERIES
-- =============================================================================

-- Test route checking performance
EXPLAIN QUERY PLAN 
SELECT 1 FROM dynamic_routes 
WHERE route_pattern = 'شركات-تداول-مرخصة-في-السعودية' AND is_active = 1 
LIMIT 1;

-- Test broker fetching performance  
EXPLAIN QUERY PLAN
SELECT 
  b.id, b.name, b.logo, b.rating, b.min_deposit, b.description,
  COALESCE(cs.sort_order, b.default_sort_order) as sort_order
FROM brokers b
LEFT JOIN country_sorting cs ON b.id = cs.broker_id AND cs.country_code = 'EG'
WHERE b.is_active = 1
ORDER BY COALESCE(cs.sort_order, b.default_sort_order) ASC
LIMIT 6;

-- Test unsupported brokers performance
EXPLAIN QUERY PLAN
SELECT 
  uc.broker_id, uc.restriction_type, uc.reason,
  b.name as broker_name,
  alt.id as alternative_id, alt.name as alternative_name
FROM unsupported_countries uc
JOIN brokers b ON uc.broker_id = b.id
LEFT JOIN brokers alt ON uc.alternative_broker_id = alt.id
WHERE uc.country_code = 'EG' AND uc.is_active = 1 AND b.is_active = 1;
