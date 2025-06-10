import { build } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function quickBuild() {
  try {
    console.log('Starting optimized production build...');
    
    await build({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      mode: 'production',
      logLevel: 'info',
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              lucide: ['lucide-react'],
              radix: ['@radix-ui/react-select', '@radix-ui/react-dialog'],
              query: ['@tanstack/react-query']
            }
          }
        }
      }
    });
    
    console.log('✅ Production build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

quickBuild();