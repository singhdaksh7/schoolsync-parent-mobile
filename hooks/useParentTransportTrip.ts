import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { ParentTransportTripResponse, TransportTrip } from '@/lib/types';

const POLL_INTERVAL_MS = 10000;

/**
 * Polls GET /api/mobile/parent/transport/trip every ~10s (Phase 2C, item
 * 23) for the CURRENTLY SELECTED child — `studentId` must come from the
 * same multi-child switcher state the rest of the parent dashboard uses
 * (see hooks/useParentDashboard.ts's `selectedStudentId` /
 * `handleChildChange`), so switching children here always reflects the
 * child the guardian is actually looking at, not a stale/first child.
 *
 * No maps, no location history — only the latest trip snapshot the backend
 * returns each poll is ever kept; nothing accumulates a trail client-side.
 */
export function useParentTransportTrip(studentId: string | null) {
  const { token } = useAuth();
  const [trip, setTrip] = useState<TransportTrip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!token || !studentId) {
      setTrip(null);
      return;
    }
    setError(null);
    try {
      const result = await apiRequest<ParentTransportTripResponse>(
        `/api/mobile/parent/transport/trip?studentId=${encodeURIComponent(studentId)}`,
        {},
        token
      );
      setTrip(result.trip ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trip status.');
    } finally {
      setLoading(false);
    }
  }, [token, studentId]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!token || !studentId) {
      setTrip(null);
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
  }, [token, studentId, load]);

  return { trip, loading, error, refresh: load };
}
