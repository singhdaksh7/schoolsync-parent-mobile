import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { ParentTransportChild, ParentTransportTripResponse } from '@/lib/types';

const POLL_INTERVAL_MS = 10000;

/**
 * Polls GET /api/mobile/parent/transport/trip every ~10s (Phase 2C, item
 * 23). The backend returns ONE ENTRY PER LINKED CHILD in a single call
 * (`{ children: [...] }`) — there is no per-child studentId query param, so
 * this always reflects every child the guardian has, not just whichever one
 * is currently selected in the multi-child switcher (see
 * hooks/useParentDashboard.ts / lib/parent-selection-context.tsx).
 *
 * No maps, no location history — only the latest snapshot the backend
 * returns each poll is ever kept; nothing accumulates a trail client-side.
 */
export function useParentTransportTrip() {
  const { token } = useAuth();
  const [children, setChildren] = useState<ParentTransportChild[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setChildren([]);
      return;
    }
    setError(null);
    try {
      const result = await apiRequest<ParentTransportTripResponse>('/api/mobile/parent/transport/trip', {}, token);
      setChildren(Array.isArray(result.children) ? result.children : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trip status.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!token) {
      setChildren([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [token, load]);

  return { children, loading, error, refresh: load };
}
