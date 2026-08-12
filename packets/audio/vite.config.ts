import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ExtAudio',
      fileName: (format) => {
        if (format === 'umd' || format === 'iife') return 'ext-audio.min.js';
        if (format === 'cjs') return 'ext-audio.cjs';
        return 'ext-audio.js';
      },
      formats: ['es', 'cjs', 'umd']
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'ext-audio.css';
          return assetInfo.name || 'asset-[hash][extname]';
        }
      }
    }
  }
});
