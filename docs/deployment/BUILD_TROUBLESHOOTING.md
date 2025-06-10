# Build Troubleshooting Guide

## 🛠️ Recent Changes Made

### 1. Updated Build Configuration
- **Removed `--legacy-peer-deps`** from Netlify build command
- **Added `npm audit fix --force`** to address vulnerabilities
- **Changed from `npm install` to `npm ci`** for more reliable builds
- **Updated audit level** to moderate to catch important issues

### 2. Fixed Package Versions
- **Updated `@testing-library/react`** from v16.3.0 → v13.4.0 (React 18 compatible)
- **Maintained stable versions** for all other packages
- **Added proper engine constraints** for Node.js and npm

### 3. Enhanced Build Process
- **Created `build.sh`** script for local testing
- **Updated `clean-install.sh`** to use new approach
- **Added `.npmrc`** files for consistent behavior
- **Improved error handling** in build scripts

## 🚨 Common Build Issues & Solutions

### Issue 1: "npm audit found vulnerabilities"
**Solution:**
```bash
cd client
npm audit fix --force
npm run build
```

### Issue 2: "Peer dependency warnings"
**Solution:**
- Ensure all packages are compatible
- Check `package.json` for version conflicts
- Use `npm ls` to identify problematic dependencies

### Issue 3: "Build fails with exit code 1"
**Diagnosis Steps:**
1. Check Node.js version: `node --version` (should be ≥18.0.0)
2. Clear cache: `npm cache clean --force`
3. Delete node_modules: `rm -rf node_modules package-lock.json`
4. Reinstall: `npm ci`
5. Run audit: `npm audit fix --force`
6. Try build: `npm run build`

### Issue 4: "Chart.js related errors"
**Solution:**
- Verify `react-chartjs-2` is installed: `npm list react-chartjs-2`
- Check imports in `ResultsPanel.js` are correct
- Ensure Chart.js components are registered

## 📋 Pre-deployment Checklist

Before pushing to Netlify:
- [ ] Run `./clean-install.sh` locally
- [ ] Test build with `./build.sh`
- [ ] Check for console errors
- [ ] Verify all components render correctly
- [ ] Test Chart.js functionality
- [ ] Ensure no critical vulnerabilities remain

## 🔍 Debugging Commands

### Local Build Testing
```bash
# Clean install and build
./clean-install.sh
./build.sh

# Manual step-by-step
cd client
npm ci
npm audit fix --force
npm run build
```

### Check Dependencies
```bash
# List all dependencies
npm ls

# Check for vulnerabilities
npm audit

# Check outdated packages
npm outdated
```

### Netlify-specific Testing
```bash
# Simulate Netlify build command
cd client
npm ci --prefer-offline
npm audit fix --force --audit-level=moderate
npm run build
```

## 🆘 Emergency Rollback

If the build is completely broken:

1. **Revert package.json changes:**
   ```bash
   git checkout HEAD~1 -- client/package.json server/package.json
   ```

2. **Use legacy approach temporarily:**
   ```bash
   # In netlify.toml, change command to:
   command = "npm install --legacy-peer-deps && npm run build"
   ```

3. **Clear all caches:**
   ```bash
   rm -rf client/node_modules server/node_modules
   rm -f client/package-lock.json server/package-lock.json
   ```

## 🎯 Expected Results

After these fixes:
- ✅ No deprecation warnings during build
- ✅ npm audit shows only low/moderate vulnerabilities
- ✅ Build completes with exit code 0
- ✅ All React components render correctly
- ✅ Chart.js displays properly in ResultsPanel

## 📞 If Issues Persist

1. **Check Netlify build logs** for specific error messages
2. **Compare local vs Netlify environment** differences
3. **Test with minimal package.json** to isolate issues
4. **Consider updating Node.js version** in netlify.toml
5. **Review recent npm/React breaking changes**

## 🔄 Build Process Flow

```
1. npm ci --prefer-offline
   ↓
2. npm audit fix --force --audit-level=moderate  
   ↓
3. npm run build
   ↓
4. Deploy to client/build/
```

This ensures a clean, secure, and reliable build process. 