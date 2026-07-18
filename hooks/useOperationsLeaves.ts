import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { OperationsTeacherLeaveListResponse } from '@/lib/types';

const SCOPE = 'ops-leaves';

/**
 * GET/PATCH /api/schools/[schoolId]/leaves(/[leaveId]) scoped to TEACHER-type
 * leave requests — Operations Leave Management. The backend enforces
 * SELF_LEAVE_APPROVAL_FORBIDDEN server-side regardless of transport; this
 * hook surfaces that reasonCode as a normal error rather than special-casing it.
 */
export function useOperationsLeaves() {
  const { token, user } = useAuth();
  const schoolId = user?.schoolId;
  const [data, setData] = useState<OperationsTeacherLeaveListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);
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
          () => apiRequest<OperationsTeacherLeaveListResponse>(`/api/schools/${schoolId}/leaves?type=TEACHER&status=PENDING`, {}, token),
          { force }
        );
        setData(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load teacher leave requests.');
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

  const decide = useCallback(
    async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
      if (!token || !schoolId) return false;
      setError(null);
      setDecidingId(leaveId);
      try {
        await apiRequest(`/api/schools/${schoolId}/leaves/${leaveId}`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
        invalidatePrefix(cacheKey(token, SCOPE));
        await load(true);
        return true;
      } catch (decideError) {
        // The backend's SELF_LEAVE_APPROVAL_FORBIDDEN reasonCode is
        // deliberately not surfaced by the shared error parser (it only reads
        // `code`, not `reasonCode`) — the screen already disables this action
        // for the teacher's own leave request, so reaching this catch means a
        // genuine 403 (authority lost) rather than the self-approval case.
        setError(decideError instanceof Error ? decideError.message : 'Failed to update the leave request.');
        return false;
      } finally {
        setDecidingId(null);
      }
    },
    [token, schoolId, load]
  );

  return { data, loading, refreshing, decidingId, error, handleRefresh, decide };
}
