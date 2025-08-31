#!/usr/bin/env node

/**
 * Enhanced build script that sets cache version environment variables
 * This runs before Astro build to inject proper cache versioning
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function generateBuildInfo() {
  try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Get git commit hash (if available)
    let gitHash = '';
    try {
      const { stdout } = await execAsync('git rev-parse --short HEAD');
      gitHash = stdout.trim();
    } catch (error) {
      console.warn('Git not available, using timestamp for version');
    }
    
    // Generate build timestamp
    const buildTime = new Date().toISOString();
    const buildDate = buildTime.split('T')[0];
    const buildHour = new Date().getHours();
    
    // Create cache version
    const cacheVersion = gitHash 
      ? `${packageJson.version}-${gitHash}`
      : `${packageJson.version}-${buildDate}-${buildHour}`;
    
    // Create build info object
    const buildInfo = {
      version: packageJson.version,
      buildTime,
      buildDate,
      gitHash,
      cacheVersion,
      nodeVersion: process.version
    };
    
    // Write build info to a file for runtime access
    const buildInfoPath = path.join(process.cwd(), 'src/build-info.json');
    fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
    
    console.log('🏗️  Build Info Generated:');
    console.log(`   Version: ${buildInfo.cacheVersion}`);
    console.log(`   Build Time: ${buildInfo.buildTime}`);
    console.log(`   Git Hash: ${buildInfo.gitHash || 'N/A'}`);
    
    return buildInfo;
    
  } catch (error) {
    console.error('Error generating build info:', error);
    // Return fallback build info
    return {
      version: '0.0.1',
      buildTime: new Date().toISOString(),
      buildDate: new Date().toISOString().split('T')[0],
      gitHash: '',
      cacheVersion: `0.0.1-${Date.now()}`,
      nodeVersion: process.version
    };
  }
}

async function build() {
  console.log('🚀 Starting enhanced build process...');
  
  // Generate build info
  const buildInfo = await generateBuildInfo();
  
  // Set environment variables for the build
  process.env.BUILD_TIMESTAMP = buildInfo.buildTime;
  process.env.CACHE_VERSION = buildInfo.cacheVersion;
  process.env.BUILD_DATE = buildInfo.buildDate;
  process.env.GIT_HASH = buildInfo.gitHash;
  
  console.log('📦 Running Astro build...');
  
  try {
    // Run Astro build with our environment variables
    const buildCommand = 'npx astro build';
    const { stdout, stderr } = await execAsync(buildCommand, {
      env: {
        ...process.env,
        BUILD_TIMESTAMP: buildInfo.buildTime,
        CACHE_VERSION: buildInfo.cacheVersion,
        BUILD_DATE: buildInfo.buildDate,
        GIT_HASH: buildInfo.gitHash
      }
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Build completed successfully!');
    console.log('📋 Build Summary:');
    console.log(`   Cache Version: ${buildInfo.cacheVersion}`);
    console.log(`   Build completed at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the build if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build().catch(error => {
    console.error('Build script failed:', error);
    process.exit(1);
  });
}

export { build, generateBuildInfo };