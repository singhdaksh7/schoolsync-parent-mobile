import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';

const SCOPE = 'teacher-full-leave';

export type TeacherFullLeave = {
  id: string;
  reason: string;
  fromDate: string;
  toDate: string;
  status: string;
  reviewedBy: { name: string } | null;
};

export type CreateFullLeaveInput = { reason: string; fromDate: string; toDate: string };

/**
 * GET/POST /api/teacher/leaves — the full multi-day personal leave request.
 * Distinct from early-leave (single-day, "leave after period N"). Self-only:
 * this route has no approval/reject capability, and none is exposed here —
 * Operations leave management is a separate, unrelated surface.
 */
export function useTeacherFullLeave() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState<TeacherFullLeave[]>([]);
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
          () => apiRequest<TeacherFullLeave[]>('/api/teacher/leaves', {}, token),
          { force }
        );
        // Normalize at the fetch boundary — see useTeacherSchedule for why.
        setLeaves(Array.isArray(result) ? result : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load leave requests.');
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

  const createLeave = useCallback(
    async (input: CreateFullLeaveInput) => {
      if (!token) return false;
      setError(null);
      setCreating(true);
      try {
        await apiRequest('/api/teacher/leaves', { method: 'POST', body: JSON.stringify(input) }, token);
        invalidatePrefix(cacheKey(token, SCOPE));
        await load(true);
        return true;
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : 'Failed to submit leave request.');
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

  return { leaves, loading, refreshing, creating, error, createLeave, handleRefresh };
}
