# 🚀 Complete Deployment Guide

Step-by-step instructions for deploying the TheQA Astro platform with Cloudflare Worker integration.

## 📋 Prerequisites

### **Required Accounts & Tools**
- ✅ **Cloudflare Account** (Free tier sufficient)
- ✅ **GitHub Account** (for version control)
- ✅ **Node.js 18+** (for local development)
- ✅ **Git** (for version control)

### **Required CLI Tools**
```bash
# Install Node.js (18+)
node --version  # Should be 18.0.0 or higher

# Install Wrangler CLI
npm install -g wrangler

# Verify installation
wrangler --version
```

## 🏗️ Project Setup

### **1. Clone Repository**
```bash
# Clone the project
git clone https://github.com/yourusername/theqa-astro.git
cd theqa-astro

# Install dependencies
npm install
```

### **2. Project Structure Overview**
```
theqa-astro/
├── src/                 # Astro frontend source
├── broker-proxy-worker/ # Cloudflare Worker
├── dist/               # Built static files
├── test-performance.sh # Performance testing
└── cache-analyzer.html # Performance dashboard
```

## ☁️ Cloudflare Setup

### **1. Cloudflare Account Setup**
```bash
# Login to Cloudflare
wrangler login

# This will open browser for authentication
# Follow the prompts to authorize Wrangler
```

### **2. Create D1 Database**
```bash
# Create D1 database
wrangler d1 create broker-sorting-db

# Output will show:
# database_id = "ba34ff09-69bb-4c57-989b-92f07aa8015a"
# Copy this ID for wrangler.toml
```

### **3. Create KV Namespace**
```bash
# Create KV namespace for caching
wrangler kv namespace create "CACHE"

# Output will show:
# id = "a6271f83f7fe4090ab82f3aea1c080fa"  
# Copy this ID for wrangler.toml
```

### **4. Configure wrangler.toml**
```toml
# broker-proxy-worker/wrangler.toml
name = "broker-proxy-worker"
main = "worker.js"
compatibility_date = "2025-09-04"

[vars]
PURGE_TOKEN = "your-secure-token-here"
CACHE_TTL = 3600
BROKER_CACHE_TTL = 1800
MAX_BROKERS_PER_COUNTRY = 6
ENVIRONMENT = "production"

routes = [
  "yourdomain.com/*"  # Replace with your domain
]

[[d1_databases]]
binding = "DB"
database_name = "broker-sorting-db"
database_id = "ba34ff09-69bb-4c57-989b-92f07aa8015a"  # Your database ID

[[kv_namespaces]]
binding = "CACHE"
id = "a6271f83f7fe4090ab82f3aea1c080fa"  # Your KV namespace ID

# Cron triggers for automatic cache warming
[triggers]
crons = ["0 */6 * * *"]

# Environment-specific configurations
[env.production.vars]
CACHE_TTL = 7200
BROKER_CACHE_TTL = 3600
DEBUG = false

[env.staging.vars]
CACHE_TTL = 900
BROKER_CACHE_TTL = 600
DEBUG = true
```

## 🗄️ Database Setup

### **1. Initialize Database Schema**
```bash
# Navigate to worker directory
cd broker-proxy-worker

# Create database tables
wrangler d1 execute broker-sorting-db --file=schema.sql

# Verify tables were created
wrangler d1 execute broker-sorting-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### **2. Add Performance Indexes**
```bash
# Apply performance optimizations
wrangler d1 execute broker-sorting-db --file=optimize-database.sql

# Verify indexes
wrangler d1 execute broker-sorting-db --command="SELECT name FROM sqlite_master WHERE type='index';"
```

### **3. Verify Sample Data**
```bash
# Check broker data
wrangler d1 execute broker-sorting-db --command="SELECT * FROM brokers LIMIT 5;"

# Check country sorting
wrangler d1 execute broker-sorting-db --command="SELECT * FROM country_sorting LIMIT 5;"

# Check dynamic routes
wrangler d1 execute broker-sorting-db --command="SELECT * FROM dynamic_routes;"
```

## ⚡ Worker Deployment

### **1. Deploy Worker**
```bash
# From broker-proxy-worker directory
wrangler deploy

# Expected output:
# ✅ Successfully deployed broker-proxy-worker
# 🌍 Worker URL: https://broker-proxy-worker.your-subdomain.workers.dev
# 📊 Dashboard: https://dash.cloudflare.com/...
```

### **2. Test Worker Endpoints**
```bash
# Test health endpoint
curl https://yourdomain.com/__health

# Test performance debug
curl https://yourdomain.com/__perf-debug

# Test metrics
curl https://yourdomain.com/__metrics
```

### **3. Configure Custom Domain**
```bash
# Add custom domain to worker
wrangler route put yourdomain.com/* broker-proxy-worker

# Or use Cloudflare Dashboard:
# 1. Go to Workers & Pages
# 2. Select your worker
# 3. Add custom domain
```

## 🌐 Astro Site Deployment

### **1. Build Static Site**
```bash
# Return to project root
cd ..

# Build the site
npm run build

# Verify build output
ls -la dist/
```

### **2. Deploy to Cloudflare Pages**
```bash
# Install Pages CLI (if needed)
npm install -g @cloudflare/pages-cli

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name theqa-astro

# Or connect GitHub repository via Dashboard
```

### **3. Alternative: Deploy to Vercel/Netlify**
```bash
# For Vercel
npx vercel --prod

# For Netlify
npx netlify deploy --prod --dir=dist
```

## 🔧 Configuration & Testing

### **1. Update Configuration Files**
```javascript
// Update base URL in test scripts
// test-performance.sh and test-performance-simple.sh
URL="https://yourdomain.com"

// Update cache analyzer
// cache-analyzer.html
const BASE_URL = "https://yourdomain.com";
```

### **2. Test Performance**
```bash
# Quick performance test
./test-performance-simple.sh

# Comprehensive test
./test-performance.sh

# Open visual analyzer
open cache-analyzer.html
```

### **3. Verify Cache Functionality**
```bash
# Test cache purge
curl -X POST https://yourdomain.com/__purge-cache \
  -H "Authorization: Bearer your-secure-token-here" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test cache warming
curl -X POST https://yourdomain.com/__warm-cache \
  -H "Authorization: Bearer your-secure-token-here"
```

## 🌍 DNS & Domain Setup

### **1. DNS Configuration**
```bash
# Add DNS records (via Cloudflare Dashboard or API)
# A record: yourdomain.com → Your origin IP
# CNAME: www.yourdomain.com → yourdomain.com

# Enable Cloudflare proxy (orange cloud)
```

### **2. SSL Configuration**
```bash
# SSL is automatic with Cloudflare
# Verify SSL certificate
curl -I https://yourdomain.com

# Should return:
# HTTP/2 200
# cf-cache-status: MISS/HIT
# x-country-code: XX
```

## 📊 Monitoring Setup

### **1. Configure Alerts**
```javascript
// Cloudflare Dashboard → Analytics & Logs → Notifications
// Set up alerts for:
// - Worker errors > 5%
// - Response time > 1000ms
// - Cache hit rate < 80%
```

### **2. Performance Monitoring**
```bash
# Set up regular performance checks
# Add to crontab or CI/CD pipeline:
0 */6 * * * /path/to/test-performance-simple.sh

# Monitor key metrics:
# - Response time < 500ms
# - Cache hit rate > 80%
# - Error rate < 1%
```

## 🔒 Security Configuration

### **1. Environment Variables**
```bash
# Set secure tokens
wrangler secret put PURGE_TOKEN
# Enter your secure token when prompted

# Verify secrets
wrangler secret list
```

### **2. Access Control**
```javascript
// Restrict admin endpoints
if (url.pathname.startsWith('/__') && 
    request.headers.get('Authorization') !== `Bearer ${env.PURGE_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
}
```

### **3. Rate Limiting**
```javascript
// Configure rate limiting in Cloudflare Dashboard
// Rules → Rate Limiting Rules
// Limit: 100 requests per minute per IP
```

## 🚦 Go Live Checklist

### **Pre-Launch**
- [ ] ✅ Worker deployed and responding
- [ ] ✅ Database populated with broker data
- [ ] ✅ Static site built and deployed
- [ ] ✅ DNS configured correctly
- [ ] ✅ SSL certificate active
- [ ] ✅ Performance tests passing
- [ ] ✅ Cache warming enabled
- [ ] ✅ Monitoring configured

### **Launch**
```bash
# 1. Final performance test
./test-performance.sh

# 2. Warm cache for all countries
curl -X POST https://yourdomain.com/__warm-cache \
  -H "Authorization: Bearer your-token"

# 3. Verify all endpoints
curl https://yourdomain.com/__health
curl https://yourdomain.com/شركات-تداول-مرخصة-في-السعودية
curl https://yourdomain.com/reviews

# 4. Check performance metrics
open cache-analyzer.html
```

### **Post-Launch**
- [ ] ✅ Monitor error rates
- [ ] ✅ Check cache hit rates
- [ ] ✅ Verify geographic performance
- [ ] ✅ Test from different countries
- [ ] ✅ Monitor database performance

## 🔄 Updates & Maintenance

### **Deploying Updates**
```bash
# 1. Update worker code
cd broker-proxy-worker
wrangler deploy

# 2. Update static site
cd ..
npm run build
npx wrangler pages deploy dist

# 3. Purge cache if needed
curl -X POST https://yourdomain.com/__purge-cache \
  -H "Authorization: Bearer your-token" \
  -d '{"pattern": "*"}'
```

### **Database Updates**
```bash
# Add new brokers
wrangler d1 execute broker-sorting-db --command="
INSERT INTO brokers (name, slug, rating, min_deposit) 
VALUES ('NewBroker', 'newbroker', 4.0, 100);"

# Update country sorting
wrangler d1 execute broker-sorting-db --command="
INSERT INTO country_sorting (country_code, broker_id, sort_order) 
VALUES ('EG', 5, 1);"
```

### **Performance Monitoring**
```bash
# Regular performance checks
./test-performance-simple.sh

# Monthly comprehensive analysis
./test-performance.sh > monthly-report.txt

# Analyze cache performance
curl https://yourdomain.com/__metrics | jq '.'
```

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Worker Not Responding**
```bash
# Check worker status
wrangler tail

# Check logs
wrangler logs

# Redeploy if needed
wrangler deploy
```

#### **2. Database Connection Issues**
```bash
# Test database connection
wrangler d1 execute broker-sorting-db --command="SELECT 1;"

# Check binding in wrangler.toml
# Verify database_id matches
```

#### **3. Cache Not Working**
```bash
# Check KV namespace
wrangler kv key list --namespace-id=your-kv-id

# Test cache manually
curl -I https://yourdomain.com/test-page
# Look for: cf-cache-status, x-cache-hit headers
```

#### **4. Performance Issues**
```bash
# Run performance debug
curl https://yourdomain.com/__perf-debug

# Check database indexes
wrangler d1 execute broker-sorting-db --file=optimize-database.sql

# Monitor response times
./test-performance.sh
```

### **Support Resources**
- 📚 [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- 💬 [Cloudflare Discord](https://discord.gg/cloudflaredev)
- 🐛 [GitHub Issues](https://github.com/yourusername/theqa-astro/issues)
- 📧 [Contact Support](mailto:support@yourdomain.com)

---

**🎉 Congratulations!** Your TheQA Astro platform is now deployed and running with intelligent caching and dynamic content delivery.
