const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== [CI Stage: Lint & Code Quality] ===');

const filesToLint = [
  'src/app.js',
  'src/server.js',
  'tests/app.test.js'
];

let hasErrors = false;
const rootDir = path.resolve(__dirname, '..');

for (const relativeFile of filesToLint) {
  const fullPath = path.join(rootDir, relativeFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ [Lint Error] File missing: ${relativeFile}`);
    hasErrors = true;
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  try {
    // Validate JS syntax using Node's script compilation
    new vm.Script(content);
    console.log(`✅ [Lint Pass] ${relativeFile} (Syntax Validated)`);
  } catch (err) {
    console.error(`❌ [Lint Error] Syntax error in ${relativeFile}: ${err.message}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n❌ Linting failed! Pipeline stopping.');
  process.exit(1);
} else {
  console.log('\n🚀 All files passed code quality checks.\n');
  process.exit(0);
}
