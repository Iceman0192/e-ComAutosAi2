import { build } from 'vite';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function buildForProduction() {
  console.log('Starting production build...');
  
  try {
    // Build the frontend with Vite
    await build({
      root: 'client',
      build: {
        outDir: '../server/public',
        emptyOutDir: true,
      },
      resolve: {
        alias: {
          "@": path.resolve(process.cwd(), "client", "src"),
          "@shared": path.resolve(process.cwd(), "shared"),
          "@assets": path.resolve(process.cwd(), "attached_assets"),
        },
      },
    });
    
    console.log('Frontend build completed');
    
    // Build the server
    execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit'
    });
    
    console.log('Server build completed');
    console.log('Production build finished successfully!');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildForProduction();