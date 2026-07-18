import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { persistSession, loadSession, clearSession } from '@/lib/session';

const SECURE_KEY = 'schoolsync.mobile.session.v2';
const LEGACY_KEY = 'schoolsync.mobile.session.v1';

const USER = { id: 'u-1', name: 'Test User', role: 'TEACHER' } as unknown as Parameters<typeof persistSession>[1];

describe('session — SecureStore-backed bearer session', () => {
  beforeEach(async () => {
    await SecureStore.deleteItemAsync(SECURE_KEY);
    await AsyncStorage.removeItem(LEGACY_KEY);
  });

  it('persists and restores the session via SecureStore, not AsyncStorage', async () => {
    await persistSession('token-abc', USER);

    const stored = await SecureStore.getItemAsync(SECURE_KEY);
    expect(stored).toContain('token-abc');
    // The bearer token must never land in plain AsyncStorage.
    const plain = await AsyncStorage.getItem(LEGACY_KEY);
    expect(plain).toBeNull();

    const restored = await loadSession();
    expect(restored).toEqual({ token: 'token-abc', user: USER });
  });

  it('migrates a legacy plaintext AsyncStorage session into SecureStore exactly once', async () => {
    await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify({ token: 'legacy-token', user: USER }));

    const restored = await loadSession();
    expect(restored).toEqual({ token: 'legacy-token', user: USER });

    // Legacy copy is deleted after migration...
    expect(await AsyncStorage.getItem(LEGACY_KEY)).toBeNull();
    // ...and the session now lives in SecureStore.
    expect(await SecureStore.getItemAsync(SECURE_KEY)).toContain('legacy-token');
  });

  it('deletes a corrupt legacy entry without restoring a session', async () => {
    await AsyncStorage.setItem(LEGACY_KEY, 'not-json');

    const restored = await loadSession();
    expect(restored).toBeNull();
    expect(await AsyncStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('returns null when no session exists anywhere', async () => {
    expect(await loadSession()).toBeNull();
  });

  it('clearSession removes both the secure and legacy entries', async () => {
    await persistSession('token-xyz', USER);
    await AsyncStorage.setItem(LEGACY_KEY, 'stale');

    await clearSession();

    expect(await SecureStore.getItemAsync(SECURE_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(LEGACY_KEY)).toBeNull();
  });
});
