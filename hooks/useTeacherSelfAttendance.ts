import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { TeacherTodayAttendance } from '@/lib/types';

const SCOPE = 'teacher-self-attendance';

/**
 * GET /api/teacher/attendance/today + POST /api/teacher/attendance/mark —
 * the teacher's OWN daily attendance. There is no bearer-reachable route for
 * marking a class/section's student attendance (that route is
 * NextAuth-web-session-only) — see Phase 6C report Mobile Integration
 * Blockers. This hook is scoped to self-attendance only.
 */
export function useTeacherSelfAttendance() {
  const { token } = useAuth();
  const [attendance, setAttendance] = useState<TeacherTodayAttendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE),
          CACHE_TTL.ATTENDANCE,
          () => apiRequest<TeacherTodayAttendance>('/api/teacher/attendance/today', {}, token),
          { force }
        );
        setAttendance(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load attendance status.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useForegroundRefresh(useCallback(() => load(), [load]));

  const markPresent = useCallback(async () => {
    if (!token) return;
    setError(null);
    setMarking(true);
    try {
      await apiRequest('/api/teacher/attendance/mark', { method: 'POST', body: JSON.stringify({ status: 'PRESENT' }) }, token);
      invalidatePrefix(cacheKey(token, SCOPE));
      await load(true);
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Failed to mark attendance.');
    } finally {
      setMarking(false);
    }
  }, [token, load]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return { attendance, loading, refreshing, error, marking, markPresent, handleRefresh };
}
