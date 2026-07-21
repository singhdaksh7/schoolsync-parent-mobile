import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { TeacherEarlyLeave } from '@/lib/types';

const SCOPE = 'teacher-early-leave';

export type CreateEarlyLeaveInput = { date: string; leaveAfterPeriod: number; reason: string };

/**
 * GET/POST /api/teacher/early-leave — a single-day "leave after period N"
 * request. This is a DIFFERENT feature from the full multi-day
 * LeaveRequest (/api/teacher/leaves), which is NextAuth-web-session-only and
 * not reachable from mobile — see Phase 6C report Mobile Integration
 * Blockers. This hook only covers the early-leave flow that actually has a
 * bearer-JWT route.
 */
export function useTeacherEarlyLeave() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<TeacherEarlyLeave[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE),
          CACHE_TTL.ATTENDANCE,
          () => apiRequest<TeacherEarlyLeave[]>('/api/teacher/early-leave', {}, token),
          { force }
        );
        // Normalize at the fetch boundary — see useTeacherSchedule for why.
        setRequests(Array.isArray(result) ? result : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load early-leave requests.');
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

  const createRequest = useCallback(
    async (input: CreateEarlyLeaveInput) => {
      if (!token) return false;
      setError(null);
      setCreating(true);
      try {
        await apiRequest('/api/teacher/early-leave', { method: 'POST', body: JSON.stringify(input) }, token);
        invalidatePrefix(cacheKey(token, SCOPE));
        await load(true);
        return true;
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : 'Failed to submit early-leave request.');
        return false;
      } finally {
        setCreating(false);
      }
    },
    [token, load]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return { requests, loading, refreshing, creating, error, createRequest, handleRefresh };
}
