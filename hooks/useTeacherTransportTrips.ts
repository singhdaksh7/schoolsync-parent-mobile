import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { TeacherTransportTrip, TeacherTransportTripsResponse } from '@/lib/types';

const POLL_INTERVAL_MS = 10000;

/** Polls GET /api/mobile/teacher/transport/trips every ~10s (Phase 2C, item
 * 24) — active trips already scoped server-side to the teacher's sections,
 * so no client-side filtering by section/class is needed here. */
export function useTeacherTransportTrips() {
  const { token } = useAuth();
  const [trips, setTrips] = useState<TeacherTransportTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setTrips([]);
      return;
    }
    setError(null);
    try {
      const result = await apiRequest<TeacherTransportTripsResponse>('/api/mobile/teacher/transport/trips', {}, token);
      setTrips(Array.isArray(result.trips) ? result.trips : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active trips.');
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
      setTrips([]);
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

  return { trips, loading, error, refresh: load };
}
