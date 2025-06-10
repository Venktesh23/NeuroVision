# Deployment Documentation

This folder contains all deployment-related documentation and guides for the NeuroVision project.

## 📁 Documentation Files

### Main Guides
- **[NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)** - Original Netlify deployment guide
- **[FINAL_NETLIFY_FIX.md](./FINAL_NETLIFY_FIX.md)** - Final working deployment configuration
- **[ESLINT_FIXES.md](./ESLINT_FIXES.md)** - ESLint build failure fixes

### Troubleshooting
- **[BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md)** - Comprehensive build troubleshooting
- **[NETLIFY_FIX.md](./NETLIFY_FIX.md)** - Earlier Netlify configuration attempts
- **[PACKAGE_UPDATES.md](./PACKAGE_UPDATES.md)** - Package deprecation fixes

## 🛠️ Scripts

Scripts have been moved to the `scripts/` folder:
- **[build.sh](../../scripts/build.sh)** - Local build testing script
- **[clean-install.sh](../../scripts/clean-install.sh)** - Clean dependency installation

## 📋 Configuration Files (Root Directory)

These files must remain in the root directory:
- **netlify.toml** - Netlify build configuration
- **.nvmrc** - Node.js version specification
- **.npmrc** - npm configuration
- **package.json** - Workspace configuration

## 🚀 Quick Start

1. **For local testing**: Run `./scripts/build.sh`
2. **For clean install**: Run `./scripts/clean-install.sh`
3. **For deployment**: Push to GitHub (auto-deploys via Netlify)

## 📖 Recommended Reading Order

1. Start with [FINAL_NETLIFY_FIX.md](./FINAL_NETLIFY_FIX.md) for current working config
2. Check [ESLINT_FIXES.md](./ESLINT_FIXES.md) for recent fixes
3. Use [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md) if issues arise 