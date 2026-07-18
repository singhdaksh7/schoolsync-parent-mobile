import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { OperationsTeacherStatusResponse, OperationsTeacherStatusUpdateResponse } from '@/lib/types';

const SCOPE = 'ops-teacher-status';

/**
 * GET/PATCH /api/schools/[schoolId]/operations/teachers/status. The backend
 * itself refuses SELF_TEACHER_STATUS_MUTATION_FORBIDDEN when the acting
 * effective head targets their own teacherId — this hook does not need to
 * (and must not) re-implement that rule; the screen disables the control
 * client-side purely as a UX nicety.
 */
export function useOperationsTeacherStatus() {
  const { token, user } = useAuth();
  const schoolId = user?.schoolId;
  const [data, setData] = useState<OperationsTeacherStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE),
          CACHE_TTL.TEACHER_STATUS,
          () => apiRequest<OperationsTeacherStatusResponse>(`/api/schools/${schoolId}/operations/teachers/status?limit=100`, {}, token),
          { force }
        );
        setData(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load teacher status.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, schoolId]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, schoolId]);

  useForegroundRefresh(useCallback(() => load(), [load]));

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const setStatus = useCallback(
    async (teacherId: string, status: 'PRESENT' | 'ABSENT') => {
      if (!token || !schoolId) return null;
      setError(null);
      setUpdatingId(teacherId);
      try {
        const result = await apiRequest<OperationsTeacherStatusUpdateResponse>(
          `/api/schools/${schoolId}/operations/teachers/status`,
          { method: 'PATCH', body: JSON.stringify({ updates: [{ teacherId, status }] }) },
          token
        );
        const outcome = result.results[0];
        if (!outcome?.ok) {
          setError(
            outcome?.reason === 'SELF_TEACHER_STATUS_MUTATION_FORBIDDEN'
              ? 'You cannot change your own status this way.'
              : outcome?.reason === 'ON_APPROVED_LEAVE'
                ? 'This teacher is on approved leave today.'
                : 'Failed to update teacher status.'
          );
        } else {
          invalidatePrefix(cacheKey(token, SCOPE));
          await load(true);
        }
        return outcome ?? null;
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : 'Failed to update teacher status.');
        return null;
      } finally {
        setUpdatingId(null);
      }
    },
    [token, schoolId, load]
  );

  return { data, loading, refreshing, updatingId, error, handleRefresh, setStatus };
}
