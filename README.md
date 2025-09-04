# TheQA Astro - Intelligent Broker Platform with Dynamic Caching

A high-performance broker comparison platform built with Astro and powered by an intelligent Cloudflare Worker that provides dynamic content delivery, country-specific broker sorting, and advanced caching strategies.

## 🏗️ Project Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REQUEST FLOW                            │
└─────────────────────────────────────────────────────────────────┘

User Request → Cloudflare Edge → Worker → D1 Database → Response
     ↓              ↓              ↓           ↓           ↓
   Browser    ┌─────────────┐  ┌──────────┐ ┌─────────┐ ┌──────────┐
             │ Cloudflare  │  │  Worker  │ │   D1    │ │ Astro    │
             │    CDN      │  │ (Router) │ │Database │ │ Static   │
             └─────────────┘  └──────────┘ └─────────┘ └──────────┘
                    ↕              ↕           ↕           ↕
              ┌─────────────┐  ┌──────────┐ ┌─────────┐ ┌──────────┐
              │ KV Storage  │  │ Cache    │ │ Broker  │ │ HTML     │
              │ (30min TTL) │  │ Monitor  │ │ Data    │ │ Pages    │
              └─────────────┘  └──────────┘ └─────────┘ └──────────┘
```

## 📁 Project Structure

```
theqa-astro/
├── 🌐 Frontend (Astro Static Site)
│   ├── src/
│   │   ├── pages/           # Static pages + dynamic [slug].astro
│   │   ├── components/      # Reusable components
│   │   ├── layouts/         # Page layouts
│   │   └── content/         # Articles and content
│   └── dist/                # Built static files
│
├── ⚡ Worker (Cloudflare Edge Computing)
│   ├── worker.js            # Main worker logic
│   ├── schema.sql           # Database schema
│   ├── wrangler.toml        # Worker configuration
│   └── optimize-*.sql       # Performance optimizations
│
├── 🧪 Testing & Monitoring
│   ├── test-performance.sh  # Comprehensive testing
│   ├── cache-analyzer.html  # Performance dashboard
│   └── test-performance-simple.sh
│
└── 📚 Documentation
    ├── README.md            # This file
    ├── CACHING-GUIDE.md     # Detailed caching explanation
    ├── WORKER-GUIDE.md      # Worker architecture guide
    └── DEPLOYMENT-GUIDE.md  # Deployment instructions
```

## 🚀 How The System Works

### 1. **User Makes Request**
```
User visits: https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية
```

### 2. **Cloudflare Worker Intercepts**
```javascript
// Worker detects user's country
const userCountry = request.cf?.country || 'US'; // e.g., 'EG' for Egypt

// Checks if route needs dynamic processing
if (shouldProcess('/شركات-تداول-مرخصة-في-السعودية')) {
    // Process with dynamic broker data
} else {
    // Pass through to static Astro site
}
```

### 3. **Dynamic Content Generation**
```javascript
// Get country-specific broker data
const brokers = await getBrokersForCountry('EG');
// Returns: [Exness, eVest, XTB, AvaTrade] sorted for Egypt

// Get restriction data
const restrictions = await getUnsupportedBrokers('EG');
// Returns: [Evest: blocked → suggest Exness]

// Inject into HTML
html = injectBrokerData(html, brokers, 'EG', restrictions);
```

### 4. **Caching Strategy**
```javascript
// Multi-layer caching:
// Layer 1: KV Storage (30 minutes)
// Layer 2: Edge Cache (1 hour)  
// Layer 3: Browser Cache (30 minutes)
```

## 🎯 Key Features

### ✅ **Dynamic Broker Sorting**
- **Country Detection**: Automatic via Cloudflare's `request.cf.country`
- **Custom Sorting**: Each country gets optimized broker order
- **Restriction Handling**: Shows alternatives for blocked brokers

### ✅ **Intelligent Caching**
- **Multi-Layer**: KV + Edge + Browser caching
- **Smart Invalidation**: Country-specific cache keys
- **Performance Monitoring**: Real-time cache hit/miss tracking

### ✅ **Performance Optimization**
- **Sub-200ms Response**: Optimized database queries
- **Route Caching**: In-memory route checking
- **Database Timeouts**: Prevents hanging queries

### ✅ **Monitoring & Analytics**
- **Real-time Metrics**: Cache performance tracking
- **Health Endpoints**: System status monitoring
- **Performance Testing**: Automated testing suite

## 🔧 Technologies Used

| **Component** | **Technology** | **Purpose** |
|---------------|----------------|-------------|
| **Frontend** | Astro.js | Static site generation |
| **Backend** | Cloudflare Worker | Edge computing & routing |
| **Database** | Cloudflare D1 | SQLite-based data storage |
| **Cache** | Cloudflare KV | Key-value storage |
| **CDN** | Cloudflare CDN | Global content delivery |
| **Monitoring** | Custom Dashboard | Performance analytics |

## 📊 Performance Metrics

### **Current Performance (Optimized)**
- **Response Time**: 200-400ms average
- **Cache Hit Rate**: 85-95%
- **Database Queries**: 5-25ms
- **Route Checking**: 0-5ms (in-memory cache)

### **Performance Improvements Made**
- **Route Checking**: 90% faster (0-5ms from 10-50ms)
- **Database Queries**: 75% faster (5-20ms from 20-100ms)
- **Overall Response**: 50% improvement

## 🌍 Geographic Features

### **Supported Countries**
- 🇸🇦 **Saudi Arabia (SA)**: Arabic content, local broker preferences
- 🇪🇬 **Egypt (EG)**: Regulatory compliance, restricted brokers
- 🇦🇪 **UAE (AE)**: Regional broker optimization
- 🇺🇸 **USA (US)**: US-compliant brokers only
- 🇬🇧 **UK (GB)**: European broker focus
- **+ 10 more countries**

### **Country-Specific Features**
```javascript
// Example: Egypt (EG) user
{
  brokers: [Exness, XTB, AvaTrade], // Sorted for Egypt
  restricted: [eVest → suggest Exness], // Compliance handling
  language: 'ar', // Arabic interface
  currency: 'EGP' // Local currency display
}
```

## 🚦 Getting Started

### **Prerequisites**
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### **Quick Start**
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/theqa-astro.git
cd theqa-astro

# 2. Install dependencies
npm install

# 3. Deploy the worker
cd broker-proxy-worker
wrangler deploy

# 4. Build the site
cd ..
npm run build

# 5. Test performance
./test-performance-simple.sh
```

## 📚 Documentation Index

- **[CACHING-GUIDE.md](./CACHING-GUIDE.md)** - Complete caching system explanation
- **[WORKER-GUIDE.md](./WORKER-GUIDE.md)** - Worker architecture deep dive
- **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** - Step-by-step deployment
- **[API-REFERENCE.md](./API-REFERENCE.md)** - Worker endpoints documentation

## 🧪 Testing & Monitoring

### **Performance Testing**
```bash
# Quick test
./test-performance-simple.sh

# Comprehensive test
./test-performance.sh

# Visual dashboard
open cache-analyzer.html
```

### **Monitoring Endpoints**
- `/__health` - System health check
- `/__metrics` - Performance metrics
- `/__perf-debug` - Performance diagnostics
- `/__cache-debug` - Cache troubleshooting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with the performance suite
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Ready to dive deeper?** Start with the [CACHING-GUIDE.md](./CACHING-GUIDE.md) to understand the caching system in detail.
