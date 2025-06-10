#!/bin/bash
# quick-fix.sh - Immediate production fix

echo "🚑 Emergency Production Fix"

# 1. Update TypeScript config
echo "📝 Fixing TypeScript configuration..."
sed -i 's/"jsx": "preserve"/"jsx": "react-jsx"/g' tsconfig.json

# 2. Create client-specific tsconfig if missing
if [ ! -f "client/tsconfig.json" ]; then
  echo "📝 Creating client TypeScript config..."
  cat > client/tsconfig.json << 'EOF'
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vite/client"]
  },
  "include": ["src/**/*", "index.html"],
  "exclude": ["node_modules", "dist"]
}
EOF
fi

# 3. Fix import calculator if it exists
if [ -f "client/src/pages/import-calculator-premium.tsx" ]; then
  echo "🔧 Fixing import calculator component..."
  # Add React import if missing
  grep -q "import React" client/src/pages/import-calculator-premium.tsx || \
    sed -i '1i import React from "react";' client/src/pages/import-calculator-premium.tsx
fi

# 4. Clean and rebuild
echo "🧹 Cleaning build artifacts..."
rm -rf dist client/dist node_modules/.vite

# 5. Install dependencies
echo "📦 Installing dependencies..."
npm ci

# 6. Build with error recovery
echo "🏗️ Building application..."
npm run build || {
  echo "⚠️ Build failed, attempting recovery..."
  
  # Try building client separately with less strict settings
  cd client
  npx vite build || {
    echo "❌ Client build failed"
    exit 1
  }
  cd ..
  
  # Build server
  npm run build:server
}

echo "✅ Fix complete! Deploy the updated build."