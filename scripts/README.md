# Build Scripts

This folder contains utility scripts for building and testing the NeuroVision application.

## Available Scripts

### `build.sh`
Local build testing script that:
- Cleans npm cache
- Installs dependencies with legacy peer deps
- Builds the React application with CI=false
- Shows build output and size

**Usage:**
```bash
./scripts/build.sh
```

### `clean-install.sh` 
Complete dependency cleanup and reinstall script that:
- Removes all node_modules and package-lock.json files
- Cleans npm cache
- Fresh install of all dependencies
- Tests build process

**Usage:**
```bash
./scripts/clean-install.sh
```

## When to Use

- **Before deployment**: Run `clean-install.sh` to ensure clean state
- **Build testing**: Run `build.sh` to test local builds
- **Troubleshooting**: Use `clean-install.sh` if dependencies are corrupted
- **CI/CD simulation**: Both scripts use same flags as Netlify

## Notes

- Scripts set `CI=false` to prevent ESLint treating warnings as errors
- Uses `--legacy-peer-deps` to handle deprecated package warnings
- All scripts include error handling and detailed output 