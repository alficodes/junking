const fs = require('fs');
const path = require('path');

console.log('=== [CI Stage: Build & Package Artifact] ===');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Ensure clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy essential runtime files
const filesToPackage = ['package.json'];
for (const file of filesToPackage) {
  fs.copyFileSync(path.join(rootDir, file), path.join(distDir, file));
}

// Copy src directory
fs.cpSync(path.join(rootDir, 'src'), path.join(distDir, 'src'), { recursive: true });

// Generate build metadata
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const buildMetadata = {
  name: packageJson.name,
  version: packageJson.version,
  buildNumber: process.env.BUILD_NUMBER || 'local-build-1',
  jobName: process.env.JOB_NAME || 'jenkins-mini-project',
  gitCommit: process.env.GIT_COMMIT || 'development-head',
  builtAt: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'production'
};

fs.writeFileSync(
  path.join(distDir, 'build-info.json'),
  JSON.stringify(buildMetadata, null, 2),
  'utf8'
);

console.log(`✅ Build artifact created in: ${distDir}`);
console.log('📦 Build Metadata:', JSON.stringify(buildMetadata, null, 2));
console.log('\n🚀 Artifact build successfully finished!\n');
