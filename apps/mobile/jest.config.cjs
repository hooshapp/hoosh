/** SDK-native component/adapter tests. Portable TypeScript belongs to Vitest. */
const shared = {
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/**/*.native.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
};

module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'ios',
      preset: 'jest-expo/ios',
      testPathIgnorePatterns: ['/node_modules/', '\\.android\\.native\\.test\\.ts$'],
    },
    {
      ...shared,
      displayName: 'android',
      preset: 'jest-expo/android',
      testPathIgnorePatterns: ['/node_modules/', '\\.ios\\.native\\.test\\.ts$'],
    },
  ],
};
