#!/bin/bash

# Build script for NeuroVision
set -e  # Exit on any error

echo "🚀 Starting NeuroVision build process..."

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
ls -la build/

echo "🎉 NeuroVision build process completed!" 