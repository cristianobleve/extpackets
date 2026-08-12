import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ExtPlayer',
      fileName: (format) => {
        if (format === 'umd' || format === 'iife') return 'ext-player.min.js';
        if (format === 'cjs') return 'ext-player.cjs';
        return 'ext-player.js';
      },
      formats: ['es', 'cjs', 'umd']
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'ext-player.css';
          return assetInfo.name || 'ext-player.[ext]';
        },
        exports: 'named',
        globals: {}
      }
    },
    sourcemap: true,
    minify: 'esbuild'
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: [
      "9094-109-117-101-36.ngrok-free.app"
    ]
  }
});
