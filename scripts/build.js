#!/usr/bin/env node
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('Building for production...');

try {
  // Build frontend from client directory with correct output path
  console.log('Building frontend...');
  process.chdir(resolve(rootDir, 'client'));
  execSync('npx vite build --outDir ../server/public', { stdio: 'inherit' });
  
  // Return to root directory
  process.chdir(rootDir);
  
  // Build server
  console.log('Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('Production build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}