// Runs before any test module is imported — lib/api-client.ts reads
// EXPO_PUBLIC_API_URL into a module-level const at import time, so this must
// be set here (setupFiles), not in a beforeEach/beforeAll. https:// (not
// http://) since api-client now fails closed on a non-https base URL.
process.env.EXPO_PUBLIC_API_URL = 'https://localhost:3000';
// Same module-level-const-at-import-time reasoning as EXPO_PUBLIC_API_URL
// above — a real (non-empty) value here so SCHOOL_SLUG_CONFIG_ERROR is null
// by default across the suite; tests exercising the missing-slug case reset
// this explicitly (see tests/unified-login-payload.test.ts).
process.env.EXPO_PUBLIC_SCHOOL_SLUG = 'test-school';

// jest-expo doesn't auto-mock the AsyncStorage native module; use the
// package's own official in-memory mock (per its Jest integration docs).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// jest-expo's default auto-mock for expo-secure-store returns undefined from
// every method instead of actually storing anything — replace it with a tiny
// in-memory store so session persistence tests observe real read-after-write.
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
  };
});
