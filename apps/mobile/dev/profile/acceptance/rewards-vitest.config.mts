import { defineConfig } from 'vitest/config';
/** Only the guarded PostgreSQL runner supplies ephemeral accounts and loopback origin. */
export default defineConfig({ test: {
  environment: 'node', include: ['dev/profile/acceptance/rewards-http.acceptance.ts'],
  fileParallelism: false, testTimeout: 15000,
} });
