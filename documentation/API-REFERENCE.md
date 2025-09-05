# 🔌 API Reference Guide

Complete reference for all Cloudflare Worker endpoints and their functionality.

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Health & Monitoring Endpoints](#health--monitoring-endpoints)
3. [Cache Management Endpoints](#cache-management-endpoints)
4. [Debug & Analysis Endpoints](#debug--analysis-endpoints)
5. [Response Headers Reference](#response-headers-reference)
6. [Error Codes](#error-codes)
7. [Rate Limits](#rate-limits)
8. [Usage Examples](#usage-examples)

## 🔐 Authentication

Most administrative endpoints require Bearer token authentication:

```bash
# Authorization header required for admin endpoints
Authorization: Bearer dfdf76dfdfyuh343kfd63hje3

# Public endpoints (no auth required)
/__health, /__metrics, /__perf-debug, /__cache-debug, /__cache-status
```

## 🏥 Health & Monitoring Endpoints

### **GET /__health**
System health check with performance metrics.

**Request:**
```bash
curl https://astro.theqalink.com/__health
```

**Response:**
```json
{
    "status": "healthy",
    "hitRate": "87.4%",
    "totalRequests": 1430,
    "topCountries": [
        ["EG", 450],
        ["SA", 380],
        ["AE", 220]
    ],
    "topRoutes": [
        ["/شركات-تداول-مرخصة-في-السعودية", 680],
        ["/reviews", 520]
    ],
    "recommendations": [
        "Excellent cache performance! Consider expanding cache coverage"
    ],
    "timestamp": "2025-09-04T13:00:00.000Z"
}
```

**Status Values:**
- `healthy`: Hit rate > 80%, no critical errors
- `degraded`: Hit rate 60-80%, minor issues
- `critical`: Hit rate < 60%, major issues

---

### **GET /__metrics**
Detailed performance metrics and analytics.

**Request:**
```bash
curl https://astro.theqalink.com/__metrics
```

**Response:**
```json
{
    "hits": 1250,
    "misses": 180,
    "errors": 5,
    "countries": {
        "EG": 450,
        "SA": 380,
        "AE": 220,
        "US": 180,
        "GB": 120
    },
    "routes": {
        "/شركات-تداول-مرخصة-في-السعودية": 680,
        "/reviews": 520,
        "/منصات-تداول-العملات-الرقمية-في-الإمارات": 230
    },
    "processingTimes": [45, 52, 38, 41, 49],
    "avgProcessingTime": 45.2,
    "timestamp": "2025-09-04T13:00:00.000Z"
}
```

**Metrics Explanation:**
- `hits`: Successful cache hits
- `misses`: Cache misses requiring database queries
- `errors`: Failed requests
- `countries`: Request count per country
- `routes`: Request count per route
- `avgProcessingTime`: Average response time in milliseconds

## 🗄️ Cache Management Endpoints

### **POST /__purge-cache**
Purge cache entries manually.

**Authentication:** Required

**Request:**
```bash
# Purge all cache
curl -X POST https://astro.theqalink.com/__purge-cache \
  -H "Authorization: Bearer dfdf76dfdfyuh343kfd63hje3" \
  -H "Content-Type: application/json" \
  -d '{}'

# Purge specific country
curl -X POST https://astro.theqalink.com/__purge-cache \
  -H "Authorization: Bearer dfdf76dfdfyuh343kfd63hje3" \
  -H "Content-Type: application/json" \
  -d '{"country": "EG"}'

# Purge specific pattern
curl -X POST https://astro.theqalink.com/__purge-cache \
  -H "Authorization: Bearer dfdf76dfdfyuh343kfd63hje3" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "broker-data-*"}'
```

**Response:**
```json
{
    "success": true,
    "message": "Cache purged successfully",
    "cleared": [
        {
            "path": "/شركات-تداول-مرخصة-في-السعودية",
            "country": "EG",
            "deleted": true
        },
        {
            "path": "/reviews",
            "country": "EG", 
            "deleted": true
        }
    ],
    "timestamp": "2025-09-04T13:00:00.000Z"
}
```

---

### **POST /__warm-cache**
Trigger manual cache warming for all countries and routes.

**Authentication:** Required

**Request:**
```bash
curl -X POST https://astro.theqalink.com/__warm-cache \
  -H "Authorization: Bearer dfdf76dfdfyuh343kfd63hje3"
```

**Response:**
```json
{
    "success": true,
    "message": "Cache warming completed",
    "warmed": {
        "countries": ["EG", "SA", "AE", "US", "GB", "DE"],
        "routes": [
            "/شركات-تداول-مرخصة-في-السعودية",
            "/reviews",
            "/منصات-تداول-العملات-الرقمية-في-الإمارات"
        ],
        "totalOperations": 18,
        "successfulOperations": 17,
        "failedOperations": 1
    },
    "duration": "2.4s",
    "timestamp": "2025-09-04T13:00:00.000Z"
}
```

---

### **GET /__cache-status**
Get cache status for current user's country.

**Request:**
```bash
curl https://astro.theqalink.com/__cache-status
```

**Response:**
```json
{
    "country": "EG",
    "cacheKey": "broker-data-EG-v2",
    "cached": true,
    "dataAge": "15m",
    "brokerCount": 4,
    "restrictionCount": 2,
    "hitRate": "87%",
    "recommendations": [
        "Cache performance looks good"
    ],
    "timestamp": "2025-09-04T13:00:00.000Z"
}
```

## 🔍 Debug & Analysis Endpoints

### **GET /__perf-debug**
Performance diagnostics and timing analysis.

**Request:**
```bash
# Basic performance debug
curl https://astro.theqalink.com/__perf-debug

# Test specific path
curl "https://astro.theqalink.com/__perf-debug?path=/reviews"
```

**Response:**
```json
{
    "timings": {
        "database": 43,
        "brokerCount": 4,
        "routeCheck": 2,
        "shouldProcess": true,
        "cache": 12,
        "cacheWorking": true,
        "monitoring": 8,
        "monitoringWorking": true,
        "total": 89
    },
    "recommendations": [
        "Excellent performance! All systems running optimally"
    ],
    "country": "EG",
    "testPath": "/شركات-تداول-مرخصة-في-السعودية",
    "worker": {
        "version": "2.0-enhanced-perf",
        "environment": "production"
    },
    "timestamp": "2025-09-04T13:00:00.000Z"
}
```

**Timing Breakdown:**
- `database`: Database query time (ms)
- `routeCheck`: Route validation time (ms)
- `cache`: Cache operation time (ms)
- `monitoring`: Metrics tracking time (ms)
- `total`: Total operation time (ms)

---

### **GET /__cache-debug**
Comprehensive cache system diagnostics.

**Request:**
```bash
curl https://astro.theqalink.com/__cache-debug
```

**Response:**
```json
{
    "timestamp": "2025-09-04T13:00:00.000Z",
    "userCountry": "EG",
    "testPath": "/شركات-تداول-مرخصة-في-السعودية",
    "worker": {
        "version": "2.0-enhanced",
        "environment": "production"
    },
    "cacheTests": [
        {
            "test": "Broker Data Cache (KV)",
            "key": "broker-data-EG-v2",
            "result": "FOUND",
            "dataAge": "15m",
            "brokerCount": 4
        },
        {
            "test": "Route Processing",
            "path": "/شركات-تداول-مرخصة-في-السعودية",
            "result": "ELIGIBLE"
        },
        {
            "test": "Database Connectivity",
            "result": "SUCCESS",
            "brokerCount": 4,
            "unsupportedCount": 2
        },
        {
            "test": "Metrics Storage",
            "result": "FOUND",
            "hits": 1250,
            "misses": 180,
            "hitRate": "87.4%"
        }
    ],
    "request": {
        "url": "https://astro.theqalink.com/__cache-debug",
        "country": "EG",
        "colo": "CAI",
        "userAgent": "curl/7.68.0"
    },
    "recommendations": [
        "All systems operational - cache and database working correctly"
    ]
}
```

---

### **GET /__debug**
General system debugging information.

**Request:**
```bash
# Basic debug info
curl https://astro.theqalink.com/__debug

# Debug specific country
curl "https://astro.theqalink.com/__debug?country=SA"
```

**Response:**
```json
{
    "request": {
        "country": "EG",
        "colo": "CAI",
        "timezone": "Africa/Cairo",
        "requestedCountry": "EG",
        "userAgent": "curl/7.68.0",
        "ip": "203.0.113.1"
    },
    "cache": {
        "keys": [
            "broker-data-EG-v2",
            "page-/reviews-EG",
            "metrics:daily",
            "warming:last-run"
        ],
        "brokerDataKey": "broker-data-EG-v2",
        "status": {
            "cached": true,
            "dataAge": "15m",
            "brokerCount": 4,
            "restrictionCount": 2
        }
    },
    "database": {
        "brokersCount": 4,
        "countrySortingCount": 4,
        "unsupportedCount": 2
    },
    "worker": {
        "timestamp": "2025-09-04T13:00:00.000Z",
        "version": "2.0-enhanced"
    }
}
```

## 📤 Response Headers Reference

### **Standard Response Headers**
All dynamic responses include these headers:

```http
Content-Type: text/html; charset=utf-8
Cache-Control: public, max-age=1800, s-maxage=3600, stale-while-revalidate=300
X-Country-Code: EG
X-Broker-Count: 4
X-Unsupported-Count: 2
X-Cache-Key: broker-data-EG-v2
X-Cache-Hit: true
X-Processing-Time: 45ms
X-Timing-Cache: 12ms
X-Timing-Data: 25ms
X-Timing-Route: 2ms
CF-Cache-Tag: country:EG,page:reviews
Edge-Cache-Tag: broker-page-EG
Vary: CF-IPCountry
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Last-Modified: Wed, 04 Sep 2025 13:00:00 GMT
ETag: "abc123"
```

### **Header Explanations**

| Header | Description | Example |
|--------|-------------|---------|
| `X-Country-Code` | Detected user country | `EG`, `SA`, `US` |
| `X-Broker-Count` | Number of brokers returned | `4` |
| `X-Cache-Hit` | Cache hit status | `true`, `false` |
| `X-Processing-Time` | Total processing time | `45ms` |
| `X-Timing-Cache` | Cache operation time | `12ms` |
| `X-Timing-Data` | Database query time | `25ms` |
| `X-Timing-Route` | Route check time | `2ms` |
| `CF-Cache-Tag` | Cloudflare cache tags | `country:EG,page:reviews` |

### **Cache Control Headers**
```http
# Browser cache: 30 minutes
# Edge cache: 1 hour  
# Stale while revalidate: 5 minutes
Cache-Control: public, max-age=1800, s-maxage=3600, stale-while-revalidate=300

# Cache tags for selective purging
CF-Cache-Tag: country:EG,page:reviews,broker-data

# Vary on country for proper caching
Vary: CF-IPCountry
```

## ❌ Error Codes

### **HTTP Status Codes**

| Status | Description | Response |
|--------|-------------|----------|
| `200` | Success | Normal response with data |
| `401` | Unauthorized | Missing/invalid Bearer token |
| `404` | Not Found | Endpoint doesn't exist |
| `429` | Rate Limited | Too many requests |
| `500` | Internal Error | Worker execution error |
| `503` | Service Unavailable | Database/cache unavailable |

### **Error Response Format**
```json
{
    "error": "Database connection timeout",
    "code": "DB_TIMEOUT",
    "timestamp": "2025-09-04T13:00:00.000Z",
    "requestId": "abc-123-def",
    "country": "EG"
}
```

### **Common Error Scenarios**

#### **Authentication Errors**
```json
{
    "error": "Unauthorized access to admin endpoint",
    "code": "AUTH_REQUIRED",
    "timestamp": "2025-09-04T13:00:00.000Z"
}
```

#### **Database Errors**
```json
{
    "error": "Database query timeout after 1000ms",
    "code": "DB_TIMEOUT", 
    "fallback": "Using cached data",
    "timestamp": "2025-09-04T13:00:00.000Z"
}
```

#### **Cache Errors**
```json
{
    "error": "KV namespace not available",
    "code": "CACHE_ERROR",
    "fallback": "Direct database query",
    "timestamp": "2025-09-04T13:00:00.000Z"
}
```

## ⏱️ Rate Limits

### **Public Endpoints**
- **Rate Limit**: 100 requests per minute per IP
- **Burst Limit**: 10 requests per second
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### **Admin Endpoints**
- **Rate Limit**: 30 requests per minute per token
- **Burst Limit**: 5 requests per second
- **Special**: Cache purge limited to 10 per hour

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693838400
X-RateLimit-Retry-After: 60
```

## 💡 Usage Examples

### **Basic Health Monitoring**
```bash
#!/bin/bash
# Simple health check script

HEALTH=$(curl -s https://astro.theqalink.com/__health)
STATUS=$(echo $HEALTH | jq -r '.status')

if [ "$STATUS" != "healthy" ]; then
    echo "⚠️ System not healthy: $STATUS"
    # Send alert
else
    echo "✅ System healthy"
fi
```

### **Performance Monitoring**
```bash
#!/bin/bash
# Performance monitoring script

METRICS=$(curl -s https://astro.theqalink.com/__metrics)
HIT_RATE=$(echo $METRICS | jq -r '.hits / (.hits + .misses) * 100')

if (( $(echo "$HIT_RATE < 80" | bc -l) )); then
    echo "⚠️ Low cache hit rate: ${HIT_RATE}%"
    # Trigger cache warming
    curl -X POST https://astro.theqalink.com/__warm-cache \
      -H "Authorization: Bearer your-token"
fi
```

### **Cache Management**
```javascript
// JavaScript cache management
class CacheManager {
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl;
        this.token = token;
    }
    
    async getHealth() {
        const response = await fetch(`${this.baseUrl}/__health`);
        return response.json();
    }
    
    async purgeCache(country = null) {
        const body = country ? { country } : {};
        
        const response = await fetch(`${this.baseUrl}/__purge-cache`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        return response.json();
    }
    
    async warmCache() {
        const response = await fetch(`${this.baseUrl}/__warm-cache`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        
        return response.json();
    }
}

// Usage
const cache = new CacheManager('https://astro.theqalink.com', 'your-token');
const health = await cache.getHealth();
console.log('System status:', health.status);
```

### **Performance Testing**
```python
# Python performance testing
import requests
import time
import statistics

def test_endpoint_performance(url, iterations=10):
    times = []
    
    for i in range(iterations):
        start = time.time()
        response = requests.get(url)
        end = time.time()
        
        if response.status_code == 200:
            times.append((end - start) * 1000)  # Convert to ms
    
    return {
        'avg_time': statistics.mean(times),
        'min_time': min(times),
        'max_time': max(times),
        'std_dev': statistics.stdev(times) if len(times) > 1 else 0
    }

# Test main page
results = test_endpoint_performance('https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية')
print(f"Average response time: {results['avg_time']:.2f}ms")
```

---

**📚 Related Documentation:**
- [CACHING-GUIDE.md](./CACHING-GUIDE.md) - Detailed caching system explanation
- [WORKER-GUIDE.md](./WORKER-GUIDE.md) - Worker architecture deep dive
- [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) - Step-by-step deployment
