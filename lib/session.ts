// Secure session persistence. Replaces the pre-Phase-6 plaintext AsyncStorage
// session (SESSION_STORAGE_KEY = 'schoolsync.mobile.session.v1') with
// expo-secure-store (Keychain on iOS, Keystore-backed EncryptedSharedPreferences
// on Android), since the session holds a bearer token that authenticates as
// the user.
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppUser } from './types';

const SECURE_SESSION_KEY = 'schoolsync.mobile.session.v2';
const LEGACY_ASYNC_STORAGE_KEY = 'schoolsync.mobile.session.v1';

export type StoredSession = { token: string; user: AppUser };

export async function persistSession(token: string, user: AppUser): Promise<void> {
  await SecureStore.setItemAsync(SECURE_SESSION_KEY, JSON.stringify({ token, user }));
}

function parseStoredSession(raw: string): StoredSession | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (parsed.token && parsed.user) return { token: parsed.token, user: parsed.user };
    return null;
  } catch {
    return null;
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  const stored = await SecureStore.getItemAsync(SECURE_SESSION_KEY);
  if (stored) return parseStoredSession(stored);

  // One-time migration: builds before this security upgrade stored the
  // session in plaintext AsyncStorage. Migrate it into SecureStore once so
  // existing installs aren't silently logged out, then delete the plaintext
  // copy either way (valid or not) so this only ever runs once.
  const legacy = await AsyncStorage.getItem(LEGACY_ASYNC_STORAGE_KEY);
  if (!legacy) return null;
  const parsed = parseStoredSession(legacy);
  await AsyncStorage.removeItem(LEGACY_ASYNC_STORAGE_KEY).catch(() => undefined);
  if (!parsed) return null;
  await persistSession(parsed.token, parsed.user);
  return parsed;
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_SESSION_KEY).catch(() => undefined);
  await AsyncStorage.removeItem(LEGACY_ASYNC_STORAGE_KEY).catch(() => undefined);
}
