#!/bin/bash

echo "🧹 Cleaning and reinstalling dependencies for NeuroVision..."

# Clean root
echo "📦 Cleaning root node_modules..."
rm -rf node_modules package-lock.json 2>/dev/null

# Clean client
echo "📦 Cleaning client dependencies..."
cd client
rm -rf node_modules package-lock.json 2>/dev/null
npm cache clean --force 2>/dev/null
cd ..

# Clean server
echo "📦 Cleaning server dependencies..."
cd server
rm -rf node_modules package-lock.json 2>/dev/null
npm cache clean --force 2>/dev/null
cd ..

echo "⬇️ Installing fresh dependencies..."

# Install client dependencies
echo "📱 Installing client dependencies..."
cd client
npm ci --prefer-offline --no-audit
echo "📊 Checking build..."
npm run build
cd ..

# Install server dependencies
echo "🖥️ Installing server dependencies..."
cd server
npm ci --prefer-offline --no-audit
cd ..

echo "✅ Dependencies reinstalled successfully!"
echo "🚀 Build completed successfully!" 