const fs = require('fs');
const path = require('path');

// Read the original package.json
const packagePath = path.join(__dirname, '../package.json');
const distPackagePath = path.join(__dirname, '../dist/package.json');

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Update the package.json for publishing
const publishPackageJson = {
  ...packageJson,
  main: 'index.js',
  files: [
    '*.js',
    'components/',
    'hooks/',
    'styles/',
    'utils/',
    'README.md',
    'USAGE.md'
  ],
  scripts: {
    // Remove build scripts from published package
    test: packageJson.scripts.test
  }
};

// Write the updated package.json to dist
fs.writeFileSync(distPackagePath, JSON.stringify(publishPackageJson, null, 2));

console.log('✅ Package.json prepared for publishing');