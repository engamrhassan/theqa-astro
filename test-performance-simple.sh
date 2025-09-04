#!/bin/bash

# Simple Performance Testing Script (no dependencies)
URL="https://astro.theqalink.com"
TEST_PATH="/شركات-تداول-مرخصة-في-السعودية"

echo "🚀 Simple Performance Test - Cloudflare Worker"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Quick response time test
echo -e "\n${YELLOW}Quick Response Time Test${NC}"
echo "Testing 3 requests..."

for i in {1..3}; do
  TIME=$(curl -o /dev/null -s -w "%{time_total}" "$URL$TEST_PATH")
  echo "Request $i: ${TIME}s"
done

# Headers check
echo -e "\n${YELLOW}Performance Headers Check${NC}"
echo "Checking for performance-related headers..."
curl -I -s "$URL$TEST_PATH" | grep -E "(X-Response-Time|X-Timing|X-Processing|CF-Cache|X-Cache)" || echo "No performance headers found"

# Performance debug endpoint
echo -e "\n${YELLOW}Performance Debug Test${NC}"
PERF_RESPONSE=$(curl -s "$URL/__perf-debug")
if echo "$PERF_RESPONSE" | grep -q "timings"; then
    echo "✅ Performance debug endpoint working"
    DB_TIME=$(echo "$PERF_RESPONSE" | grep -o '"database":[0-9]*' | cut -d: -f2)
    CACHE_TIME=$(echo "$PERF_RESPONSE" | grep -o '"cache":[0-9]*' | cut -d: -f2)
    TOTAL_TIME=$(echo "$PERF_RESPONSE" | grep -o '"total":[0-9]*' | cut -d: -f2)
    echo "Database timing: ${DB_TIME:-N/A}ms"
    echo "Cache timing: ${CACHE_TIME:-N/A}ms"  
    echo "Total timing: ${TOTAL_TIME:-N/A}ms"
else
    echo "❌ Performance debug endpoint not responding properly"
fi

# Health check
echo -e "\n${YELLOW}Health Check${NC}"
HEALTH_RESPONSE=$(curl -s "$URL/__health")
if echo "$HEALTH_RESPONSE" | grep -q "status"; then
    echo "✅ Health endpoint working"
    if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
        echo "Status: Healthy"
    else
        echo "Status: Check manually"
    fi
else
    echo "❌ Health endpoint not responding"
fi

# Cache test
echo -e "\n${YELLOW}Cache Test${NC}"
echo "Testing cache effectiveness..."

echo "Purging cache..."
curl -s -X POST "$URL/__purge-cache" \
  -H "Authorization: Bearer dfdf76dfdfyuh343kfd63hje3" \
  -H "Content-Type: application/json" \
  -d '{}' > /dev/null

echo "First request (should be slower):"
TIME1=$(curl -o /dev/null -s -w "%{time_total}" "$URL$TEST_PATH")
echo "Time: ${TIME1}s"

echo "Second request (should be faster due to cache):"
TIME2=$(curl -o /dev/null -s -w "%{time_total}" "$URL$TEST_PATH")
echo "Time: ${TIME2}s"

# Simple performance analysis
echo -e "\n${GREEN}📊 Performance Summary${NC}"
echo "======================="

# Extract first decimal to compare (rough comparison)
TIME1_INT=$(echo "$TIME1" | cut -d. -f1)
TIME2_INT=$(echo "$TIME2" | cut -d. -f1)

if [ "${TIME1_INT:-0}" -gt 2 ]; then
    echo -e "${RED}❌ Slow response time (>2s)${NC}"
    echo "Consider optimizing database queries and caching"
elif [ "${TIME1_INT:-0}" -gt 1 ]; then
    echo -e "${YELLOW}⚠️ Moderate response time (1-2s)${NC}"
    echo "Performance is acceptable but can be improved"
else
    echo -e "${GREEN}✅ Good response time (<1s)${NC}"
    echo "Performance looks good!"
fi

if [[ "$TIME2" < "$TIME1" ]]; then
    echo -e "${GREEN}✅ Cache is working - second request was faster${NC}"
else
    echo -e "${YELLOW}⚠️ Cache effectiveness unclear${NC}"
fi

echo -e "\n${BLUE}💡 Quick Tips:${NC}"
echo "  • Use /__perf-debug for detailed analysis"
echo "  • Monitor /__health for system status"
echo "  • Check /__metrics for cache statistics"
echo "  • Run cache warming with /__warm-cache"

echo -e "\n${GREEN}Test completed! 🎉${NC}"
echo "For detailed analysis, run: ./test-performance.sh"
