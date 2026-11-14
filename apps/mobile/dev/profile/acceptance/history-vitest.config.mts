import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['dev/profile/acceptance/history-http.acceptance.ts'],
    fileParallelism: false,
    testTimeout: 15000,
  },
});
