#!/bin/bash
echo "Starting production build..."

# Clean previous build
rm -rf server/public/* dist/*
mkdir -p server/public

# Build frontend using the working deploy-fix approach
echo "Building frontend..."
node deploy-fix.js

# Copy frontend assets to the location the production server expects
echo "Copying assets to dist/public..."
mkdir -p dist/public
cp -r server/public/* dist/public/

echo "Production build completed!"