import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/** Separate developer entry: Expo Router/release exports never import this tree. */
export default defineConfig({
  root: fileURLToPath(new URL('./ui', import.meta.url)),
  define: { __DEV__: 'true' },
  // Let Vite's web-extension resolver choose this library's web implementations.
  optimizeDeps: { exclude: ['react-native-safe-area-context'] },
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
    ],
    extensions: [
      '.web.tsx',
      '.tsx',
      '.web.ts',
      '.ts',
      '.web.jsx',
      '.jsx',
      '.web.js',
      '.js',
      '.mjs',
      '.json',
    ],
  },
  oxc: { jsx: { runtime: 'automatic' } },
  server: { host: '127.0.0.1', port: 8091, strictPort: true },
  build: {
    assetsInlineLimit: 0,
    outDir: '../dist',
    emptyOutDir: true,
    rolldownOptions: {
      onwarn(warning, warn) {
        // This isolated entry is entirely client-side; there are no RSC boundaries.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client'))
          return;
        warn(warning);
      },
    },
  },
});
