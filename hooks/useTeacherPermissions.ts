import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import type { TeacherPermissionsResponse } from '@/lib/types';

const SCOPE = 'teacher-permissions';

/**
 * Foundation hook for GET /api/teacher/permissions. Not wired into any screen
 * yet (no UI redesign in this stage) — a future nav/action-gating pass
 * consumes this. Gated by the TEACHER_PERMISSIONS feature flag: a 403 here
 * means "this school has no custom RBAC to report," not "logged out," so it
 * is treated as a normal empty state, never a global session invalidation.
 * Not authority — the backend re-checks permissions on every mutating route;
 * this value must never be copied into a permanent/offline permission store.
 */
export function useTeacherPermissions() {
  const { token, role } = useAuth();
  const [data, setData] = useState<TeacherPermissionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const load = useCallback(
    async (force = false) => {
      if (!token || role !== 'TEACHER') return;
      setLoading(true);
      setError(null);
      setUnavailable(false);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE),
          CACHE_TTL.TEACHER_PERMISSIONS,
          () => apiRequest<TeacherPermissionsResponse>('/api/teacher/permissions', {}, token),
          { force }
        );
        setData(result);
      } catch (loadError) {
        if (loadError instanceof ApiError && loadError.status === 403) {
          setUnavailable(true);
          setData(null);
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'Failed to load teacher permissions.');
      } finally {
        setLoading(false);
      }
    },
    [token, role]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  return { data, loading, error, unavailable, refresh: () => load(true) };
}
