import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ExtLightbox',
      fileName: (format) => {
        if (format === 'umd' || format === 'iife') return 'ext-lightbox.min.js';
        if (format === 'cjs') return 'ext-lightbox.cjs';
        return 'ext-lightbox.js';
      },
      formats: ['es', 'cjs', 'umd']
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'ext-lightbox.css';
          return assetInfo.name || 'asset-[hash][extname]';
        }
      }
    }
  }
});
