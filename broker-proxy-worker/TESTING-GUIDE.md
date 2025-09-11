# D1 Worker Testing & Usage Guide

## What Was Fixed

The worker now properly:
1. **Reads D1 data dynamically** - Queries the database for each country
2. **Reflects D1 changes quickly** - Reduced cache TTL from 30 minutes to 5 minutes
3. **Supports cache busting** - Force fresh data with `?bust_cache=1`
4. **Provides cache invalidation** - Manual cache clearing when D1 data changes
5. **Better logging** - Shows what data is being fetched from D1

## Testing the Fixes

### 1. Deploy the Updated Worker

```bash
cd broker-proxy-worker
wrangler deploy
```

### 2. Test D1 Database Connection

```bash
# Test the D1 queries directly
wrangler dev --local
# Then visit: http://localhost:8787/test-d1
```

### 3. Test Dynamic Broker Data

Visit your site with different countries:
- US users: Should see eVest, AvaTrade, XTB, Exness (in that order)
- UK users: Should see XTB, AvaTrade, eVest, Exness (in that order)
- German users: Should see XTB, eVest, AvaTrade, Exness (in that order)

### 4. Test Cache Busting

Force fresh data from D1:
```
https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية?bust_cache=1
```

Check response headers:
- `X-Cache-Hit: false` (cache was bypassed)
- `X-Cache-Busted: true` (cache busting was used)
- `X-Broker-Count: X` (number of brokers from D1)

### 5. Test Cache Invalidation

When you update D1 data, invalidate the cache:

```bash
curl -X POST https://astro.theqalink.com/__invalidate-d1 \
  -H "Authorization: Bearer dfdf76dfdfyuh343kfd63hje3" \
  -H "Content-Type: application/json" \
  -d '{"countries": ["US", "SA", "AE"]}'
```

Or invalidate all countries:
```bash
curl -X POST https://astro.theqalink.com/__invalidate-d1 \
  -H "Authorization: Bearer dfdf76dfdfyuh343kfd63hje3" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Monitoring & Debugging

### Check Worker Logs
```bash
wrangler tail
```

### Debug Endpoints

1. **Health Check**: `/__health`
2. **Cache Status**: `/__cache-status`
3. **Debug Info**: `/__debug?country=US`
4. **Cache Debug**: `/__cache-debug?path=/reviews`
5. **Performance Debug**: `/__perf-debug`

### Response Headers to Monitor

- `X-Country-Code`: Detected user country
- `X-Broker-Count`: Number of brokers returned
- `X-Cache-Hit`: Whether data came from cache
- `X-Cache-Busted`: Whether cache busting was used
- `X-Processing-Time`: Total processing time in ms

## Updating D1 Data

### 1. Connect to D1 Database
```bash
wrangler d1 execute broker-sorting-db --command "SELECT * FROM brokers;"
```

### 2. Update Broker Data
```bash
# Add a new broker
wrangler d1 execute broker-sorting-db --command "
INSERT INTO brokers (name, slug, rating, min_deposit, description, default_sort_order) 
VALUES ('NewBroker', 'newbroker', 4.0, 100, 'New trading broker', 5);
"

# Update existing broker
wrangler d1 execute broker-sorting-db --command "
UPDATE brokers SET rating = 4.8, min_deposit = 50 WHERE name = 'Exness';
"
```

### 3. Update Country Sorting
```bash
# Set custom order for Saudi Arabia
wrangler d1 execute broker-sorting-db --command "
INSERT OR REPLACE INTO country_sorting (country_code, broker_id, sort_order, is_featured) 
VALUES ('SA', 1, 1, 1), ('SA', 2, 2, 1), ('SA', 3, 3, 0);
"
```

### 4. Invalidate Cache After Changes
```bash
curl -X POST https://astro.theqalink.com/__invalidate-d1 \
  -H "Authorization: Bearer dfdf76dfdfyuh343kfd63hje3" \
  -H "Content-Type: application/json"
```

## Troubleshooting

### Issue: Broker data not updating
**Solution**: 
1. Check if D1 data was actually updated
2. Invalidate cache using `/__invalidate-d1`
3. Use `?bust_cache=1` to force fresh data
4. Check worker logs for errors

### Issue: Wrong broker order for country
**Solution**:
1. Check `country_sorting` table for that country
2. Update sort orders in D1
3. Invalidate cache

### Issue: Cache not working
**Solution**:
1. Check KV namespace binding in wrangler.toml
2. Verify `CACHE` binding is working via `/__debug`
3. Check worker logs for cache errors

## Performance Notes

- **Cache TTL**: Reduced to 5 minutes for faster updates
- **Database timeout**: 1 second timeout on D1 queries
- **Fallback data**: Uses hardcoded brokers if D1 fails
- **Parallel queries**: Broker data and restrictions fetched simultaneously

## Next Steps

1. **Test with real traffic** - Monitor performance and cache hit rates
2. **Add more countries** - Populate `country_sorting` for more regions
3. **Monitor D1 usage** - Check D1 dashboard for query performance
4. **Set up alerts** - Monitor cache hit rates and error rates
