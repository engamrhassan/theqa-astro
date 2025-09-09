#!/usr/bin/env node

/**
 * Cache Health Check Script
 * Monitors cache system performance and alerts on issues
 *
 * Usage: node cache-health-check.js [--verbose] [--json]
 */

import { getCacheBuster, getCacheInfo } from './src/utils/cache-simple.js';
import { execSync } from 'child_process';
import fs from 'fs';

// Configuration
const HEALTH_CHECK_CONFIG = {
  targetCacheHitRate: 80, // Minimum acceptable cache hit rate (%)
  maxResponseTime: 1000, // Maximum acceptable response time (ms)
  criticalEndpoints: [
    'https://astro.theqalink.com/',
    'https://astro.theqalink.com/reviews/',
    'https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية/',
  ],
};

class CacheHealthChecker {
  constructor() {
    this.verbose = process.argv.includes('--verbose');
    this.jsonOutput = process.argv.includes('--json');
    this.results = {
      timestamp: new Date().toISOString(),
      version: getCacheInfo().version,
      status: 'UNKNOWN',
      checks: {},
      errors: [],
      warnings: [],
      recommendations: [],
    };
  }

  log(message, level = 'info') {
    if (this.jsonOutput) return;

    const timestamp = new Date().toTimeString().split(' ')[0];
    const prefix =
      {
        info: '📋',
        success: '✅',
        warning: '⚠️ ',
        error: '❌',
        debug: '🔍',
      }[level] || 'ℹ️ ';

    if (level !== 'debug' || this.verbose) {
      console.log(`${prefix} [${timestamp}] ${message}`);
    }
  }

  async checkCacheVersion() {
    this.log('Checking cache version...', 'debug');

    try {
      const cacheInfo = getCacheInfo();
      this.results.checks.cacheVersion = {
        status: 'PASS',
        version: cacheInfo.version,
        buildTime: cacheInfo.buildTime,
        strategies: cacheInfo.strategies,
      };

      // Check if build info file exists
      if (!fs.existsSync('src/build-info.json')) {
        this.results.warnings.push(
          'Build info file missing - using fallback version'
        );
        this.results.checks.cacheVersion.buildInfoFile = false;
      } else {
        this.results.checks.cacheVersion.buildInfoFile = true;
      }

      this.log(`Cache version: ${cacheInfo.version}`, 'success');
      return true;
    } catch (error) {
      this.results.checks.cacheVersion = {
        status: 'FAIL',
        error: error.message,
      };
      this.results.errors.push(`Cache version check failed: ${error.message}`);
      this.log(`Cache version check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async checkCacheStrategies() {
    this.log('Testing cache strategies...', 'debug');

    const strategies = [
      { name: 'page', type: 'page' },
      { name: 'reviews', type: 'reviews' },
      { name: 'live', type: 'live' },
      { name: 'user', type: 'user' },
    ];

    const strategyResults = {};

    for (const strategy of strategies) {
      try {
        const cacheBuster = getCacheBuster(strategy.type);
        strategyResults[strategy.name] = {
          status: 'PASS',
          cacheBuster,
          valid: cacheBuster.includes('v='),
        };

        if (!cacheBuster.includes('v=')) {
          this.results.warnings.push(
            `${strategy.name} cache strategy missing version parameter`
          );
        }
      } catch (error) {
        strategyResults[strategy.name] = {
          status: 'FAIL',
          error: error.message,
        };
        this.results.errors.push(
          `${strategy.name} cache strategy failed: ${error.message}`
        );
      }
    }

    this.results.checks.cacheStrategies = strategyResults;
    const passedStrategies = Object.values(strategyResults).filter(
      s => s.status === 'PASS'
    ).length;
    this.log(
      `Cache strategies: ${passedStrategies}/${strategies.length} passed`,
      passedStrategies === strategies.length ? 'success' : 'warning'
    );

    return passedStrategies === strategies.length;
  }

  async checkEndpointResponse(url, timeout = 5000) {
    return new Promise(resolve => {
      const startTime = Date.now();

      try {
        // Use curl for better control and headers
        const curlCommand = `curl -I -s -w "%{http_code},%{time_total}" -m ${timeout / 1000} "${url}"`;
        const output = execSync(curlCommand, { encoding: 'utf8', timeout });

        const lines = output.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const [httpCode, timeTotal] = lastLine.split(',');

        const responseTime = Math.round(parseFloat(timeTotal) * 1000);
        const cacheHeaders = output.match(/cache-control: [^\r\n]*/i) || [];
        const xCacheHeaders = output.match(/x-cache[^:]*: [^\r\n]*/gi) || [];

        resolve({
          status: parseInt(httpCode) === 200 ? 'PASS' : 'FAIL',
          httpCode: parseInt(httpCode),
          responseTime,
          cacheHeaders: cacheHeaders[0] || 'none',
          xCacheHeaders,
          accessible: parseInt(httpCode) === 200,
          performant: responseTime < HEALTH_CHECK_CONFIG.maxResponseTime,
        });
      } catch (error) {
        resolve({
          status: 'FAIL',
          error: error.message,
          responseTime: Date.now() - startTime,
          accessible: false,
          performant: false,
        });
      }
    });
  }

  async checkCriticalEndpoints() {
    this.log('Checking critical endpoints...', 'debug');

    const endpointResults = {};

    for (const url of HEALTH_CHECK_CONFIG.criticalEndpoints) {
      this.log(`Testing: ${url}`, 'debug');
      const result = await this.checkEndpointResponse(url);
      endpointResults[url] = result;

      if (result.status === 'PASS') {
        this.log(`${url}: ${result.responseTime}ms`, 'success');
      } else {
        this.log(`${url}: ${result.error || 'Failed'}`, 'error');
        this.results.errors.push(
          `Endpoint ${url} failed: ${result.error || `HTTP ${result.httpCode}`}`
        );
      }

      if (result.responseTime > HEALTH_CHECK_CONFIG.maxResponseTime) {
        this.results.warnings.push(
          `${url} response time (${result.responseTime}ms) exceeds target (${HEALTH_CHECK_CONFIG.maxResponseTime}ms)`
        );
      }
    }

    this.results.checks.criticalEndpoints = endpointResults;

    const passedEndpoints = Object.values(endpointResults).filter(
      r => r.status === 'PASS'
    ).length;
    this.log(
      `Critical endpoints: ${passedEndpoints}/${HEALTH_CHECK_CONFIG.criticalEndpoints.length} passed`,
      passedEndpoints === HEALTH_CHECK_CONFIG.criticalEndpoints.length
        ? 'success'
        : 'error'
    );

    return passedEndpoints === HEALTH_CHECK_CONFIG.criticalEndpoints.length;
  }

  async checkBuildSystem() {
    this.log('Checking build system...', 'debug');

    const buildChecks = {};

    // Check if build scripts exist
    buildChecks.buildScript = fs.existsSync('scripts/build.js');
    buildChecks.cfBuildScript = fs.existsSync('_build-info.js');
    buildChecks.testScript = fs.existsSync('test-cache-version.js');
    buildChecks.cacheUtility = fs.existsSync('src/utils/cache-version.js');

    // Check package.json build command
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      buildChecks.packageScripts = {
        build: pkg.scripts?.build?.includes('scripts/build.js'),
        buildSimple: !!pkg.scripts?.['build:simple'],
      };
    } catch (error) {
      buildChecks.packageScripts = { error: error.message };
      this.results.errors.push(`Package.json check failed: ${error.message}`);
    }

    // Check git availability
    try {
      execSync('git --version', { stdio: 'pipe' });
      buildChecks.git = true;
    } catch (error) {
      buildChecks.git = false;
      this.results.warnings.push(
        'Git not available - cache versions will use fallback method'
      );
    }

    this.results.checks.buildSystem = buildChecks;

    const criticalChecks = [
      buildChecks.buildScript,
      buildChecks.cacheUtility,
      buildChecks.packageScripts?.build,
    ].filter(Boolean).length;

    this.log(
      `Build system: ${criticalChecks}/3 critical components available`,
      criticalChecks === 3 ? 'success' : 'warning'
    );

    return criticalChecks >= 2; // At least 2/3 critical components
  }

  generateRecommendations() {
    const { checks, errors, warnings } = this.results;

    // Performance recommendations
    if (checks.criticalEndpoints) {
      const slowEndpoints = Object.entries(checks.criticalEndpoints)
        .filter(([_, result]) => result.responseTime > 500)
        .map(([url, _]) => url);

      if (slowEndpoints.length > 0) {
        this.results.recommendations.push(
          `Consider optimizing these slow endpoints: ${slowEndpoints.join(', ')}`
        );
      }
    }

    // Build system recommendations
    if (checks.buildSystem && !checks.buildSystem.git) {
      this.results.recommendations.push(
        'Install Git to enable commit-based cache versioning for better cache invalidation'
      );
    }

    if (!checks.cacheVersion?.buildInfoFile) {
      this.results.recommendations.push(
        'Run "npm run build" to generate build info file for optimal cache versioning'
      );
    }

    // General health recommendations
    if (errors.length > 0) {
      this.results.recommendations.push(
        'Fix critical errors to ensure cache system reliability'
      );
    }

    if (warnings.length > 2) {
      this.results.recommendations.push(
        'Address warnings to optimize cache performance'
      );
    }
  }

  determineOverallStatus() {
    const { checks, errors, warnings } = this.results;

    if (errors.length > 0) {
      this.results.status = 'CRITICAL';
    } else if (warnings.length > 3) {
      this.results.status = 'WARNING';
    } else {
      // Check if all major systems are working
      const majorChecks = [
        checks.cacheVersion?.status === 'PASS',
        Object.values(checks.cacheStrategies || {}).every(
          s => s.status === 'PASS'
        ),
        Object.values(checks.criticalEndpoints || {}).filter(
          e => e.status === 'PASS'
        ).length >=
          Math.ceil(HEALTH_CHECK_CONFIG.criticalEndpoints.length * 0.8),
      ].filter(Boolean).length;

      this.results.status = majorChecks >= 3 ? 'HEALTHY' : 'DEGRADED';
    }
  }

  async runHealthCheck() {
    this.log('🏥 Starting Cache Health Check...', 'info');
    this.log(`Timestamp: ${this.results.timestamp}`, 'debug');

    try {
      // Run all checks
      await this.checkCacheVersion();
      await this.checkCacheStrategies();
      await this.checkCriticalEndpoints();
      await this.checkBuildSystem();

      // Generate insights
      this.generateRecommendations();
      this.determineOverallStatus();

      // Output results
      if (this.jsonOutput) {
        console.log(JSON.stringify(this.results, null, 2));
      } else {
        this.printSummary();
      }

      // Exit with appropriate code
      const exitCode = this.results.status === 'CRITICAL' ? 1 : 0;
      process.exit(exitCode);
    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'error');
      if (this.jsonOutput) {
        console.log(
          JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString(),
          })
        );
      }
      process.exit(1);
    }
  }

  printSummary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🏥 CACHE HEALTH CHECK SUMMARY');
    console.log('='.repeat(60));

    const statusEmoji = {
      HEALTHY: '🟢',
      DEGRADED: '🟡',
      WARNING: '🟠',
      CRITICAL: '🔴',
    };

    console.log(
      `${statusEmoji[this.results.status]} Overall Status: ${this.results.status}`
    );
    console.log(`📅 Check Time: ${this.results.timestamp}`);
    console.log(`🏷️  Cache Version: ${this.results.version}`);

    // Summary stats
    const totalChecks = Object.keys(this.results.checks).length;
    console.log(`✅ Checks Run: ${totalChecks}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);

    // Show errors if any
    if (this.results.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      this.results.errors.forEach(error => console.log(`   • ${error}`));
    }

    // Show warnings if any
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    // Show recommendations if any
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    console.log(`\n${'='.repeat(60)}`);

    const nextSteps = {
      HEALTHY: 'Cache system is running optimally! 🎉',
      DEGRADED: 'Some issues detected. Review warnings and recommendations.',
      WARNING:
        'Multiple warnings detected. Address issues to improve performance.',
      CRITICAL: '🚨 Critical issues found! Immediate action required.',
    };

    console.log(`📋 Next Steps: ${nextSteps[this.results.status]}`);
    console.log(`${'='.repeat(60)}\n`);
  }
}

// Run health check if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new CacheHealthChecker();
  checker.runHealthCheck();
}

export { CacheHealthChecker };
