import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { TeacherOperationsSelfStatus } from '@/lib/types';

const SCOPE = 'teacher-ops-self-status';

/**
 * Foundation hook for GET /api/teacher/operational-roles/self-status. Not
 * wired into any screen yet — the Teacher Operations Command Center mobile
 * experience is a later Phase 6 stage. 30s TTL per the Phase 6 cache
 * guidance; the backend resolves this fresh every call, so it must never be
 * treated as durable authority, only a live status read.
 */
export function useTeacherOperationsSelfStatus() {
  const { token, role } = useAuth();
  const [data, setData] = useState<TeacherOperationsSelfStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token || role !== 'TEACHER') return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE),
          CACHE_TTL.TEACHER_OPERATIONS_SELF_STATUS,
          () => apiRequest<TeacherOperationsSelfStatus>('/api/teacher/operational-roles/self-status', {}, token),
          { force }
        );
        setData(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load operations status.');
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

  useForegroundRefresh(useCallback(() => load(), [load]));

  return { data, loading, error, refresh: () => load(true) };
}
