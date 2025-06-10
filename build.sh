#!/bin/bash
echo "Starting production build..."

# Clean previous build
rm -rf server/public/* dist/*

# Build frontend from client directory
echo "Building frontend..."
cd client
npx vite build --outDir ../server/public
cd ..

# Build server
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Production build completed!"