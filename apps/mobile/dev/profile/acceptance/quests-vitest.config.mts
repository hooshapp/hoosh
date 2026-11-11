import { defineConfig } from 'vitest/config';
// Invoked only by the guarded disposable PostgreSQL fixture with ephemeral signed test credentials.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['dev/profile/acceptance/quests-http.acceptance.ts'],
    fileParallelism: false,
    testTimeout: 15000,
  },
});
