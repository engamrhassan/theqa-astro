// Test script for D1 database queries
// Run with: wrangler dev --local --test-scheduled

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/test-d1') {
      return testD1Queries(env);
    }
    
    return new Response('D1 Test Script - visit /test-d1', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

async function testD1Queries(env) {
  const results = [];
  
  try {
    // Test 1: Check if database is connected
    results.push('=== D1 Database Connection Test ===');
    
    if (!env.DB) {
      results.push('❌ No D1 database binding found');
      return new Response(results.join('\n'), {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    results.push('✅ D1 database binding found');
    
    // Test 2: Check brokers table
    results.push('\n=== Brokers Table Test ===');
    const brokersQuery = 'SELECT COUNT(*) as count FROM brokers WHERE is_active = 1';
    const brokersResult = await env.DB.prepare(brokersQuery).first();
    results.push(`Active brokers count: ${brokersResult.count}`);
    
    // Test 3: Get sample broker data
    const sampleBrokersQuery = `
      SELECT id, name, rating, min_deposit, default_sort_order 
      FROM brokers 
      WHERE is_active = 1 
      ORDER BY default_sort_order 
      LIMIT 5
    `;
    const sampleBrokers = await env.DB.prepare(sampleBrokersQuery).all();
    results.push('Sample brokers:');
    sampleBrokers.results.forEach(broker => {
      results.push(`  - ${broker.name} (ID: ${broker.id}, Rating: ${broker.rating}, Min Deposit: $${broker.min_deposit})`);
    });
    
    // Test 4: Check country sorting for different countries
    results.push('\n=== Country Sorting Test ===');
    const testCountries = ['US', 'GB', 'SA', 'AE'];
    
    for (const country of testCountries) {
      const countryQuery = `
        SELECT b.name, cs.sort_order, cs.is_featured
        FROM brokers b
        LEFT JOIN country_sorting cs ON b.id = cs.broker_id AND cs.country_code = ?
        WHERE b.is_active = 1
        ORDER BY COALESCE(cs.sort_order, b.default_sort_order) ASC
        LIMIT 3
      `;
      
      const countryResult = await env.DB.prepare(countryQuery).bind(country).all();
      results.push(`${country} top brokers:`);
      
      if (countryResult.results.length > 0) {
        countryResult.results.forEach((broker, index) => {
          const featured = broker.is_featured ? ' (Featured)' : '';
          results.push(`  ${index + 1}. ${broker.name}${featured}`);
        });
      } else {
        results.push('  No specific sorting found, using defaults');
      }
    }
    
    // Test 5: Check unsupported countries
    results.push('\n=== Unsupported Countries Test ===');
    const unsupportedQuery = `
      SELECT uc.country_code, b.name as broker_name, uc.restriction_type, uc.reason
      FROM unsupported_countries uc
      JOIN brokers b ON uc.broker_id = b.id
      WHERE uc.is_active = 1
      LIMIT 5
    `;
    
    const unsupportedResult = await env.DB.prepare(unsupportedQuery).all();
    if (unsupportedResult.results.length > 0) {
      results.push('Sample restrictions:');
      unsupportedResult.results.forEach(restriction => {
        results.push(`  - ${restriction.broker_name} blocked in ${restriction.country_code} (${restriction.reason})`);
      });
    } else {
      results.push('No restrictions found');
    }
    
    // Test 6: Test the optimized query function
    results.push('\n=== Optimized Query Test ===');
    const optimizedQuery = `
      SELECT 
        b.id, b.name, b.slug, b.logo, b.rating, b.min_deposit, b.description,
        b.website_url, b.company_id,
        COALESCE(cs.sort_order, b.default_sort_order) as sort_order,
        cs.is_featured,
        cs.custom_description
      FROM brokers b
      LEFT JOIN country_sorting cs ON b.id = cs.broker_id AND cs.country_code = ?
      WHERE b.is_active = 1
      ORDER BY COALESCE(cs.sort_order, b.default_sort_order) ASC
      LIMIT 6
    `;
    
    const optimizedResult = await env.DB.prepare(optimizedQuery).bind('US').all();
    results.push(`Optimized query returned ${optimizedResult.results.length} brokers for US`);
    
    results.push('\n✅ All D1 tests completed successfully!');
    
  } catch (error) {
    results.push(`\n❌ Error during testing: ${error.message}`);
    results.push(`Stack: ${error.stack}`);
  }
  
  return new Response(results.join('\n'), {
    headers: { 'Content-Type': 'text/plain' }
  });
}
