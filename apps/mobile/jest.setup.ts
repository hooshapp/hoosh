import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

// Use the library's native boundary mock; do not replace our own components.
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
