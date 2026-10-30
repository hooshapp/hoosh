import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/** Separate developer entry: Expo Router/release exports never import this tree. */
export default defineConfig({
  plugins: [
    {
      name: 'expo-core-declaration-imports',
      enforce: 'pre',
      transform(code, id) {
        // SDK 58's declaration-only module uses value imports with verbatim emit.
        // Correct their kind only in the isolated Vite preview, not SDK/app sources.
        if (!id.split('?')[0].endsWith('/expo-modules-core/src/ts-declarations/global.ts')) return;
        return {
          code: code.replace(
            /^import \{ (EventEmitter|NativeModule|SharedObject|SharedRef) \}/gm,
            'import type { $1 }',
          ),
          map: null,
        };
      },
    },
  ],
  root: fileURLToPath(new URL('./ui', import.meta.url)),
  define: { __DEV__: 'true', 'process.env.EXPO_OS': JSON.stringify('web') },
  // Let Vite's web-extension resolver choose this library's web implementations.
  optimizeDeps: {
    include: ['invariant', 'react-native-web'],
    exclude: ['react-native-safe-area-context', 'expo-image', 'expo', 'expo-modules-core'],
  },
  resolve: {
    // Expo publishes untransformed type-declaration side effects in its default build.
    // Resolve official source exports so Vite can erase their type-only imports.
    conditions: ['expo-source', 'browser', 'development|production'],
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      // expo-image uses Expo's core re-exports. Avoid Expo's Metro bootstrap in Vite.
      { find: /^expo$/, replacement: 'expo-modules-core' },
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
