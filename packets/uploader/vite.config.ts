import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ExtUploader',
      fileName: (format) => {
        if (format === 'umd' || format === 'iife') return 'ext-uploader.min.js';
        if (format === 'cjs') return 'ext-uploader.cjs';
        return 'ext-uploader.js';
      },
      formats: ['es', 'cjs', 'umd']
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'ext-uploader.css';
          return assetInfo.name || 'asset-[hash][extname]';
        }
      }
    }
  }
});
