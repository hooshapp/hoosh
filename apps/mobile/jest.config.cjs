const common = {
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/'],
};
module.exports = {
  projects: [
    {
      ...common,
      displayName: 'native-components',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/**/*.native.test.ts'],
      testPathIgnorePatterns: [...common.testPathIgnorePatterns, '\\.web\\.test\\.tsx$'],
    },
    {
      ...common,
      displayName: 'web-input',
      preset: 'jest-expo/web',
      testMatch: ['<rootDir>/src/**/*.web.test.tsx'],
    },
  ],
};
