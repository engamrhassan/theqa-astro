// Auto cache clearing script after Astro deployment
// This should run automatically after successful Cloudflare Pages deployment

const CLOUDFLARE_API = {
  ZONE_ID: 'c7adab04543a89cb1361a604ecd22d8a',
  API_TOKEN: 'UFd6NKA5tmLuyDHqukXTE_EHVsYVqenYFM6W9vO1',
  WORKER_NAME: 'broker-proxy-worker',
};

async function clearAllCaches() {
  console.log('🧹 Starting cache clearing process...');

  try {
    // Step 1: Clear Cloudflare Edge Cache
    console.log('🌐 Clearing Cloudflare Edge Cache...');
    const edgeCacheResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_API.ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: [
            'https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية/',
            'https://astro.theqalink.com/شركات-تداول-مرخصة-في-السعودية',
          ],
        }),
      }
    );

    if (edgeCacheResponse.ok) {
      console.log('✅ Edge cache cleared successfully');
    } else {
      console.log(
        '❌ Failed to clear edge cache:',
        await edgeCacheResponse.text()
      );
    }

    // Step 2: Generate new cache version
    console.log('🔧 Generating new cache version...');

    // Read current build info if available
    let newVersion;
    try {
      const buildInfo = JSON.parse(
        require('fs').readFileSync('src/build-info.json', 'utf8')
      );
      newVersion = `${buildInfo.version}-${Date.now()}`;
      console.log(`📈 New cache version: ${newVersion}`);
    } catch (error) {
      newVersion = `manual-${Date.now()}`;
      console.log(`📈 Generated cache version: ${newVersion}`);
    }

    // Instructions for manual deployment
    console.log('⚠️  NEXT STEPS:');
    console.log('   1. Redeploy your site to generate new cache version');
    console.log('   2. Or set CACHE_VERSION environment variable manually');
    console.log(`   3. Current suggested version: ${newVersion}`);

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
