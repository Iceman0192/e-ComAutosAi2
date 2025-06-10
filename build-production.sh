#!/bin/bash

echo "Starting production build process..."

# Clean any existing build artifacts
rm -rf dist/public

# Run the production build with timeout
echo "Building application..."
timeout 600 npx vite build --mode production

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Production build completed successfully!"
    echo "Build output location: dist/public/"
    ls -la dist/public/
else
    echo "❌ Production build failed or timed out"
    exit 1
fi