#!/bin/bash

# Build script for NeuroVision
set -e  # Exit on any error

echo "🚀 Starting NeuroVision build process..."

# Set environment variables to suppress warnings
export DISABLE_ESLINT_PLUGIN=true
export GENERATE_SOURCEMAP=false
export CI=true
export SKIP_PREFLIGHT_CHECK=true

# Check Node.js version
echo "📋 Checking Node.js version..."
node --version
npm --version

# Navigate to client directory
cd client

echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit

echo "🔍 Checking for vulnerabilities..."
if ! npm audit --audit-level=high; then
    echo "⚠️ High vulnerabilities found, attempting to fix..."
    npm audit fix --force || echo "⚠️ Some vulnerabilities could not be fixed automatically"
fi

echo "🔧 Building React application..."
npm run build

echo "✅ Build completed successfully!"

# List build output
echo "📂 Build output:"
ls -la build/ | head -10

echo "🎉 NeuroVision build process completed!"
echo "📊 Build size summary:"
du -sh build/ 2>/dev/null || echo "Build directory size calculation skipped" 