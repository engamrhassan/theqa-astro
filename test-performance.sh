#!/bin/bash

# Performance Testing Script for Cloudflare Worker
URL="https://astro.theqalink.com"
TEST_PATH="/شركات-تداول-مرخصة-في-السعودية"

echo "🚀 Performance Testing - Cloudflare Worker"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test 1: Basic performance metrics
echo -e "\n${YELLOW}Test 1: Basic Response Times${NC}"
echo "Measuring 5 consecutive requests..."

TOTAL_TIME=0
for i in {1..5}; do
  TIME=$(curl -o /dev/null -s -w "%{time_total}" "$URL$TEST_PATH")
  echo "Request $i: ${TIME}s"
  TOTAL_TIME=$(echo "$TOTAL_TIME + $TIME" | bc)
done

AVG_TIME=$(echo "scale=3; $TOTAL_TIME / 5" | bc)
echo "Average time: ${AVG_TIME}s"

# Test 2: Detailed timing breakdown
echo -e "\n${YELLOW}Test 2: Detailed Timing Breakdown${NC}"
curl -w "
DNS Lookup:     %{time_namelookup}s
Connect:        %{time_connect}s
SSL Handshake:  %{time_appconnect}s
Pre-transfer:   %{time_pretransfer}s
Redirect:       %{time_redirect}s
Start Transfer: %{time_starttransfer}s
Total:          %{time_total}s
Size:           %{size_download} bytes
Speed:          %{speed_download} bytes/s
HTTP Code:      %{response_code}
" -o /dev/null -s "$URL$TEST_PATH"

# Test 3: Check for performance bottlenecks in headers
echo -e "\n${YELLOW}Test 3: Response Headers Analysis${NC}"
HEADERS=$(curl -I -s "$URL$TEST_PATH")
echo "Performance-related headers:"
echo "$HEADERS" | grep -E "(X-Response-Time|X-Timing|X-Processing|CF-Cache|Server-Timing|X-Cache)" || echo "No performance headers found"

# Test 4: Test performance debug endpoint (if available)
echo -e "\n${YELLOW}Test 4: Performance Debug Endpoint${NC}"
PERF_DEBUG=$(curl -s "$URL/__perf-debug" 2>/dev/null)
if [ $? -eq 0 ] && echo "$PERF_DEBUG" | grep -q "timings"; then
    echo "✅ Performance debug endpoint available"
    if command -v jq &> /dev/null; then
        echo "Timing breakdown:"
        echo "$PERF_DEBUG" | jq '.timings // empty'
        echo "Recommendations:"
        echo "$PERF_DEBUG" | jq -r '.recommendations[]? // empty'
    else
        echo "$PERF_DEBUG"
    fi
else
    echo "❌ Performance debug endpoint not available or not responding"
fi

# Test 5: Database performance simulation
echo -e "\n${YELLOW}Test 5: Multiple Country Tests${NC}"
COUNTRIES=("US" "SA" "AE" "EG" "GB")
echo "Testing response times for different countries..."
for country in "${COUNTRIES[@]}"; do
    TIME=$(curl -o /dev/null -s -w "%{time_total}" -H "CF-IPCountry: $country" "$URL$TEST_PATH")
    echo "Country $country: ${TIME}s"
done

# Test 6: Cache effectiveness test
echo -e "\n${YELLOW}Test 6: Cache Effectiveness${NC}"
echo "Clearing cache first..."
PURGE_RESULT=$(curl -s -X POST "$URL/__purge-cache" \
  -H "Authorization: Bearer dfdf76dfdfyuh343kfd63hje3" \
  -H "Content-Type: application/json" \
  -d '{}')

if echo "$PURGE_RESULT" | grep -q "success"; then
    echo "✅ Cache purged successfully"
else
    echo "⚠️ Cache purge may have failed"
fi

echo "First request (cache MISS expected):"
TIME1=$(curl -o /dev/null -s -w "%{time_total}" "$URL$TEST_PATH")
echo "Time: ${TIME1}s"

echo "Second request (cache HIT expected):"
TIME2=$(curl -o /dev/null -s -w "%{time_total}" "$URL$TEST_PATH")
echo "Time: ${TIME2}s"

# Calculate improvement
if command -v bc &> /dev/null; then
    IMPROVEMENT=$(echo "scale=1; (($TIME1-$TIME2)/$TIME1)*100" | bc)
    echo "Cache improvement: ${IMPROVEMENT}% faster"
else
    echo "Cache comparison: First=${TIME1}s, Second=${TIME2}s"
fi

# Test 7: Concurrent requests test
echo -e "\n${YELLOW}Test 7: Concurrent Load Test${NC}"
echo "Running 5 concurrent requests..."

CONCURRENT_TIMES=()
for i in {1..5}; do
  (
    TIME=$(curl -o /dev/null -s -w "%{time_total}" "$URL$TEST_PATH")
    echo "Concurrent request $i: ${TIME}s"
  ) &
done
wait

# Test 8: Health endpoints check
echo -e "\n${YELLOW}Test 8: Health Endpoints Check${NC}"
echo "Testing worker health endpoints..."

# Health check
HEALTH=$(curl -s "$URL/__health" 2>/dev/null)
if [ $? -eq 0 ] && echo "$HEALTH" | grep -q "status"; then
    echo "✅ Health endpoint working"
    if command -v jq &> /dev/null; then
        STATUS=$(echo "$HEALTH" | jq -r '.status // "unknown"')
        echo "Status: $STATUS"
    fi
else
    echo "❌ Health endpoint not responding"
fi

# Cache debug
CACHE_DEBUG=$(curl -s "$URL/__cache-debug" 2>/dev/null)
if [ $? -eq 0 ] && echo "$CACHE_DEBUG" | grep -q "cacheTests"; then
    echo "✅ Cache debug endpoint working"
else
    echo "❌ Cache debug endpoint not responding"
fi

# Metrics
METRICS=$(curl -s "$URL/__metrics" 2>/dev/null)
if [ $? -eq 0 ] && echo "$METRICS" | grep -q "hits"; then
    echo "✅ Metrics endpoint working"
    if command -v jq &> /dev/null; then
        HITS=$(echo "$METRICS" | jq -r '.hits // 0')
        MISSES=$(echo "$METRICS" | jq -r '.misses // 0')
        echo "Cache hits: $HITS, misses: $MISSES"
    fi
else
    echo "❌ Metrics endpoint not responding"
fi

# Performance analysis and recommendations
echo -e "\n${GREEN}📊 Performance Analysis${NC}"
echo "================================"

# Convert time to milliseconds for easier comparison
TIME_MS=$(echo "$AVG_TIME * 1000" | bc 2>/dev/null || echo "0")
TIME_INT=${TIME_MS%.*}

if [ "${TIME_INT:-0}" -gt 2000 ]; then
    echo -e "${RED}❌ Slow response time (>2s)${NC}"
    echo "Recommendations:"
    echo "  • Optimize database queries"
    echo "  • Add more aggressive caching"
    echo "  • Reduce external API calls"
    echo "  • Consider query result caching"
    echo "  • Check database indexes"
elif [ "${TIME_INT:-0}" -gt 1000 ]; then
    echo -e "${YELLOW}⚠️ Moderate response time (>1s)${NC}"
    echo "Recommendations:"
    echo "  • Add worker-level caching"
    echo "  • Optimize broker data queries"
    echo "  • Use parallel database operations"
    echo "  • Consider in-memory caching"
elif [ "${TIME_INT:-0}" -gt 500 ]; then
    echo -e "${BLUE}✅ Good response time (<1s)${NC}"
    echo "Performance is acceptable but can be improved:"
    echo "  • Fine-tune cache TTLs"
    echo "  • Optimize query patterns"
else
    echo -e "${GREEN}🚀 Excellent response time (<500ms)${NC}"
    echo "Performance is excellent!"
fi

echo -e "\n${BLUE}💡 General Optimization Tips:${NC}"
echo "  • Use parallel Promise.all() for multiple queries"
echo "  • Cache broker data in Worker KV"
echo "  • Add query timeouts to prevent hanging"
echo "  • Optimize database indexes"
echo "  • Use prepared statements"
echo "  • Consider edge-side includes for dynamic content"
echo "  • Monitor with /__perf-debug endpoint"
echo "  • Use cache warming for popular routes"

echo -e "\n${GREEN}🔧 Worker-Specific Optimizations:${NC}"
echo "  • Your worker has in-memory route caching"
echo "  • Database queries have timeout protection"
echo "  • Performance monitoring is built-in"
echo "  • Cache warming runs every 6 hours"
echo "  • Multiple debug endpoints available"

echo -e "\n${YELLOW}📈 Next Steps:${NC}"
echo "  1. Run this script regularly to monitor performance"
echo "  2. Use /__perf-debug to identify bottlenecks"
echo "  3. Check /__health for system status"
echo "  4. Monitor cache hit rates with /__metrics"
echo "  5. Adjust cache TTLs based on performance data"

echo -e "\n${GREEN}Test completed! 🎉${NC}"
