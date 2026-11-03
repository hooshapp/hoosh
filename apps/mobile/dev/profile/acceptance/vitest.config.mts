import { defineConfig } from 'vitest/config';

// Explicitly invoked by the guarded PostgreSQL pytest fixture, never the ordinary mobile suite.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['dev/profile/acceptance/settings-http.acceptance.ts'],
    fileParallelism: false,
    testTimeout: 15000,
  },
});
