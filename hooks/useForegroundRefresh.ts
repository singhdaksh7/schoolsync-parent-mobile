import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Calls `onForeground` when the app transitions from background/inactive to
 * active. Screens use this to reconsider their own stale-data (via
 * cachedFetch's TTL, not a forced refetch) — never to log in again and never
 * to refetch the whole application.
 */
export function useForegroundRefresh(onForeground: () => void): void {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const callback = useRef(onForeground);
  callback.current = onForeground;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        callback.current();
      }
      appState.current = next;
    });
    return () => subscription.remove();
  }, []);
}
