# Publishing Guide for Serverless Workflow Builder Library

This guide explains how to publish the `serverless-workflow-builder-lib` to npm.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **npm CLI**: Ensure you have npm installed and are logged in
   ```bash
   npm login
   ```
3. **Git Repository**: Ensure your code is committed and pushed to a Git repository

## Pre-Publishing Checklist

- [ ] Update version in `package.json`
- [ ] Update `README.md` with latest features
- [ ] Update `USAGE.md` with any new APIs
- [ ] Test the library in the test application
- [ ] Commit all changes to Git
- [ ] Create a Git tag for the version

## Publishing Steps

### 1. Prepare for Publishing

First, navigate to the library directory:
```bash
cd src/lib
```

### 2. Update Version

Use npm's version command to bump the version:

```bash
# For patch releases (bug fixes)
npm version patch

# For minor releases (new features)
npm version minor

# For major releases (breaking changes)
npm version major
```

This will:
- Update the version in `package.json`
- Create a Git commit with the version change
- Create a Git tag
- Run the build script

### 3. Build the Library

The build process is automatically triggered by the version command, but you can also run it manually:

```bash
npm run build
```

This will:
- Clean the `dist` directory
- Copy all source files to `dist`
- Copy documentation files
- Prepare the `package.json` for publishing

### 4. Test the Build

Before publishing, test the built package:

```bash
# Navigate to dist directory
cd dist

# Test the package locally
npm pack

# This creates a .tgz file you can test in another project
```

### 5. Publish to npm

From the `dist` directory:

```bash
npm publish
```

For the first publication, you might need:
```bash
npm publish --access public
```

### 6. Verify Publication

Check that your package is available:
- Visit `https://www.npmjs.com/package/serverless-workflow-builder-lib`
- Test installation: `npm install serverless-workflow-builder-lib`

## Publishing Workflow

### For Regular Updates

```bash
# 1. Make your changes
git add .
git commit -m "feat: add new feature"

# 2. Update version and publish
npm version patch  # or minor/major
cd dist
npm publish
cd ..

# 3. Push changes
git push origin main --tags
```

### For Beta/Alpha Releases

```bash
# Update to pre-release version
npm version prerelease --preid=beta

# Publish with beta tag
cd dist
npm publish --tag beta
```

## Package Structure

The published package will have this structure:

```
serverless-workflow-builder-lib/
├── index.js                 # Main entry point
├── components/              # React components
│   ├── nodes/
│   └── common/
├── hooks/                   # Custom React hooks
├── styles/                  # CSS files
├── utils/                   # Utility functions
├── README.md               # Documentation
├── USAGE.md                # Usage examples
└── package.json            # Package configuration
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   npm login
   # Ensure you're logged in with correct credentials
   ```

2. **Package Name Conflict**
   - Check if the package name is available on npm
   - Consider scoped packages: `@your-org/serverless-workflow-builder-lib`

3. **Build Failures**
   ```bash
   # Clean and rebuild
   rm -rf dist
   npm run build
   ```

4. **Version Conflicts**
   ```bash
   # Check current version
   npm view serverless-workflow-builder-lib version
   
   # Ensure your version is higher
   npm version patch --force
   ```

### Best Practices

1. **Semantic Versioning**: Follow [semver](https://semver.org/)
   - `MAJOR.MINOR.PATCH`
   - Breaking changes = major
   - New features = minor
   - Bug fixes = patch

2. **Testing**: Always test in the test application before publishing

3. **Documentation**: Keep README and USAGE files up to date

4. **Git Tags**: Use meaningful commit messages and proper tagging

5. **Changelog**: Consider maintaining a CHANGELOG.md file

## Automation (Optional)

For automated publishing, you can set up GitHub Actions:

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: cd src/lib && npm run build
      - run: cd src/lib/dist && npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Support

For issues with publishing:
1. Check npm documentation
2. Verify package.json configuration
3. Test locally before publishing
4. Use npm's support channels if needed