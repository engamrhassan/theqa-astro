// Simple webhook test server for Astro rebuild
// Run with: node webhook-test.js

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');

const PORT = 3001;
const LOG_FILE = 'webhook-log.txt';

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/webhook/astro-rebuild') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const timestamp = new Date().toISOString();
        
        // Log the webhook call
        const logEntry = `${timestamp} - Webhook received: ${JSON.stringify(data)}\n`;
        fs.appendFileSync(LOG_FILE, logEntry);
        
        console.log(`🔥 Webhook received at ${timestamp}`);
        console.log('📝 Data:', data);
        
        // Trigger Astro rebuild
        console.log('🚀 Starting Astro rebuild...');
        
        exec('npm run build', { cwd: __dirname }, (error, stdout, stderr) => {
          const buildTime = new Date().toISOString();
          
          if (error) {
            console.error('❌ Build failed:', error.message);
            fs.appendFileSync(LOG_FILE, `${buildTime} - Build failed: ${error.message}\n`);
            
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              message: 'Build failed',
              error: error.message,
              timestamp: buildTime
            }));
            return;
          }
          
          console.log('✅ Build completed successfully!');
          console.log('📄 Build output:', stdout);
          
          fs.appendFileSync(LOG_FILE, `${buildTime} - Build completed successfully\n`);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Astro site rebuilt successfully',
            timestamp: buildTime,
            buildOutput: stdout
          }));
        });
        
      } catch (parseError) {
        console.error('❌ Failed to parse webhook data:', parseError.message);
        
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid JSON data',
          error: parseError.message
        }));
      }
    });
    
  } else if (req.method === 'GET' && req.url === '/webhook/status') {
    // Status endpoint to check if webhook server is running
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'running',
      message: 'Webhook server is active',
      timestamp: new Date().toISOString(),
      endpoints: {
        rebuild: 'POST /webhook/astro-rebuild',
        status: 'GET /webhook/status'
      }
    }));
    
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      message: 'Available endpoints: POST /webhook/astro-rebuild, GET /webhook/status'
    }));
  }
});

server.listen(PORT, () => {
  console.log(`🎣 Webhook server running on http://localhost:${PORT}`);
  console.log(`📋 Status: http://localhost:${PORT}/webhook/status`);
  console.log(`🔨 Rebuild: POST http://localhost:${PORT}/webhook/astro-rebuild`);
  console.log(`📝 Logs: ${LOG_FILE}`);
});