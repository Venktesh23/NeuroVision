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

echo "🧹 Cleaning npm cache..."
npm cache clean --force

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --no-fund

echo "🔧 Building React application (with CI=false)..."
CI=false npm run build

echo "✅ Build completed successfully!"

# List build output
echo "📂 Build output:"
ls -la build/ | head -10

echo "🎉 NeuroVision build process completed!"
echo "📊 Build size summary:"
du -sh build/ 2>/dev/null || echo "Build directory size calculation skipped" 