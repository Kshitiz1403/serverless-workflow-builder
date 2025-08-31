# Quick Publishing Guide

## Immediate Steps to Publish

### 1. Prerequisites
```bash
# Login to npm (if not already logged in)
npm login
```

### 2. Update Repository URLs (Optional)
Edit `package.json` and replace `your-username` with your actual GitHub username:
- Repository URL
- Bugs URL  
- Homepage URL

### 3. Publish Now
```bash
# Navigate to library directory
cd src/lib

# Build the library
npm run build

# Navigate to dist and publish
cd dist
npm publish --access public
```

### 4. Verify
Check your package at: `https://www.npmjs.com/package/serverless-workflow-builder-lib`

## For Future Updates

```bash
# Make changes, then:
cd src/lib
npm version patch  # or minor/major
cd dist
npm publish
```

## Test Installation
```bash
npm install serverless-workflow-builder-lib
```

That's it! Your library is now published and ready to use.