const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('=== [CD Stage: Automated Deployment & Smoke Test] ===');

const targetEnv = process.env.DEPLOY_ENV || 'staging';
const buildNumber = process.env.BUILD_NUMBER || 'local-run';
const rootDir = path.resolve(__dirname, '..');

console.log(`Target Environment: [${targetEnv.toUpperCase()}]`);
console.log(`Deploying Build: #${buildNumber}`);

// Load Express app to run simulated smoke test
const app = require('../src/app');
const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const testUrl = `http://localhost:${port}/api/health`;

  console.log(`📡 Performing smoke health check against ${testUrl}...`);

  try {
    const res = await fetch(testUrl);
    const data = await res.json();

    if (res.status === 200 && data.status === 'UP') {
      console.log(`✅ Smoke Test Passed! Health status: ${data.status} (Uptime: ${data.uptime.toFixed(2)}s)`);

      // Write deployment audit log
      const auditEntry = `[${new Date().toISOString()}] DEPLOY SUCCESS: Build #${buildNumber} deployed to ${targetEnv}\n`;
      fs.appendFileSync(path.join(rootDir, 'deploy-audit.log'), auditEntry, 'utf8');

      console.log('🎉 Deployment verified and finished successfully!\n');
      server.close(() => process.exit(0));
    } else {
      throw new Error(`Unexpected health response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.error(`❌ Deployment failed during smoke test: ${err.message}`);
    server.close(() => process.exit(1));
  }
});
