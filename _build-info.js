#!/usr/bin/env node

/**
 * Cloudflare Pages Build Hook
 * This script runs during CF Pages build to set proper environment variables
 */

import { execSync } from 'child_process';
import fs from 'fs';

function generateCloudflarePagesBuildInfo() {
  try {
    console.log('🔧 Generating build info for Cloudflare Pages...');

    // Get environment info
    const cfPages = process.env.CF_PAGES === '1';
    const commitSha = process.env.CF_PAGES_COMMIT_SHA || '';
    const branch = process.env.CF_PAGES_BRANCH || 'main';

    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    // Generate build timestamp
    const buildTime = new Date().toISOString();
    const buildDate = buildTime.split('T')[0];

    // Create cache version
    let cacheVersion;
    if (cfPages && commitSha) {
      // Use commit SHA for CF Pages builds
      cacheVersion = `${packageJson.version}-${commitSha.substring(0, 7)}`;
    } else {
      // Fallback for other environments
      const buildHour = new Date().getHours();
      cacheVersion = `${packageJson.version}-${buildDate}-${buildHour}`;
    }

    // Create build info
    const buildInfo = {
      version: packageJson.version,
      buildTime,
      buildDate,
      commitSha: commitSha.substring(0, 7),
      branch,
      cacheVersion,
      isCloudflarePages: cfPages,
      nodeVersion: process.version,
    };

    // Write build info file
    fs.writeFileSync('src/build-info.json', JSON.stringify(buildInfo, null, 2));

    // Set environment variables for the build process
    process.env.BUILD_TIMESTAMP = buildInfo.buildTime;
    process.env.CACHE_VERSION = buildInfo.cacheVersion;
    process.env.BUILD_DATE = buildInfo.buildDate;
    process.env.GIT_HASH = buildInfo.commitSha;

    console.log('✅ Build info generated:');
    console.log(`   Cache Version: ${buildInfo.cacheVersion}`);
    console.log(`   Build Time: ${buildInfo.buildTime}`);
    console.log(`   Commit SHA: ${buildInfo.commitSha || 'N/A'}`);
    console.log(`   Branch: ${buildInfo.branch}`);
    console.log(`   CF Pages: ${buildInfo.isCloudflarePages}`);

    return buildInfo;
  } catch (error) {
    console.error('❌ Error generating build info:', error);

    // Create minimal fallback
    const fallbackInfo = {
      version: '0.0.1',
      buildTime: new Date().toISOString(),
      cacheVersion: `0.0.1-${Date.now()}`,
      isCloudflarePages: false,
    };

    fs.writeFileSync(
      'src/build-info.json',
      JSON.stringify(fallbackInfo, null, 2)
    );
    return fallbackInfo;
  }
}

// Export for programmatic use
export { generateCloudflarePagesBuildInfo };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCloudflarePagesBuildInfo();
}
