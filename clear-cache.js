// Auto cache clearing script after Astro deployment
// This should run automatically after successful Cloudflare Pages deployment

const CLOUDFLARE_API = {
  ZONE_ID: 'c7adab04543a89cb1361a604ecd22d8a',
  API_TOKEN: 'UFd6NKA5tmLuyDHqukXTE_EHVsYVqenYFM6W9vO1',
  WORKER_NAME: 'broker-proxy-worker'
};

async function clearAllCaches() {
  console.log('🧹 Starting cache clearing process...');
  
  try {
    // Step 1: Clear Cloudflare Edge Cache
    console.log('🌐 Clearing Cloudflare Edge Cache...');
    const edgeCacheResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_API.ZONE_ID}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API.API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: [
          'https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية/',
          'https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية'
        ]
      })
    });
    
    if (edgeCacheResponse.ok) {
      console.log('✅ Edge cache cleared successfully');
    } else {
      console.log('❌ Failed to clear edge cache:', await edgeCacheResponse.text());
    }
    
    // Step 2: Increment Worker Cache Version
    console.log('🔧 Incrementing worker cache version...');
    const currentVersion = parseInt(process.env.CURRENT_CACHE_VERSION || '22');
    const newVersion = currentVersion + 1;
    
    console.log(`📈 Cache version: ${currentVersion} → ${newVersion}`);
    
    // You would need to update wrangler.toml and redeploy worker
    // For now, just log the instruction
    console.log('⚠️  MANUAL STEP REQUIRED:');
    console.log(`   Update CACHE_VERSION in wrangler.toml to "${newVersion}"`);
    console.log('   Then run: npx wrangler deploy');
    
    console.log('🎉 Cache clearing process completed!');
    
  } catch (error) {
    console.error('💥 Error clearing caches:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  clearAllCaches();
}

module.exports = { clearAllCaches };