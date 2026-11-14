import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['dev/profile/acceptance/recommendations-http.acceptance.ts'],
    fileParallelism: false,
    testTimeout: 15000,
  },
});
