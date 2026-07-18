import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { StudentLeave, CreateStudentLeaveInput } from './useStudentLeave';

export type { StudentLeave, CreateStudentLeaveInput } from './useStudentLeave';

const SCOPE = 'parent-leave';

/**
 * GET/POST /api/parent/leave?studentId= — guardian-submitted leave request
 * for a linked child, scoped per-child so switching children never shows a
 * stale leave list. There is no cancel/PATCH/DELETE for this route at the
 * audited backend commit (575674f) — a guardian can only view and submit,
 * never cancel, which is why no cancelLeave is exposed here.
 */
export function useParentStudentLeave(studentId: string | null) {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState<StudentLeave[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (targetStudentId: string | null, force = false) => {
      if (!token || !targetStudentId) {
        setLeaves([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE, targetStudentId),
          CACHE_TTL.ATTENDANCE,
          () =>
            apiRequest<{ leaves: StudentLeave[] }>(`/api/parent/leave?studentId=${encodeURIComponent(targetStudentId)}`, {}, token).then(
              (r) => r.leaves || []
            ),
          { force }
        );
        setLeaves(result);
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
    load(studentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, studentId]);

  useForegroundRefresh(useCallback(() => load(studentId), [load, studentId]));

  const createLeave = useCallback(
    async (input: CreateStudentLeaveInput) => {
      if (!token || !studentId) return false;
      setError(null);
      setCreating(true);
      try {
        await apiRequest('/api/parent/leave', { method: 'POST', body: JSON.stringify({ studentId, ...input }) }, token);
        invalidatePrefix(cacheKey(token, SCOPE, studentId));
        await load(studentId, true);
        return true;
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : 'Failed to submit leave request.');
        return false;
      } finally {
        setCreating(false);
      }
    },
    [token, studentId, load]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(studentId, true);
  }, [load, studentId]);

  return { leaves, loading, refreshing, creating, error, createLeave, handleRefresh };
}
