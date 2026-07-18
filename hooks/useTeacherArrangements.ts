import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { TeacherArrangement } from '@/lib/types';

const SCOPE = 'teacher-arrangements';

/** GET /api/teacher/arrangements — read-only: substitution periods assigned
 * TO this teacher. No management controls exist for a normal teacher here;
 * that belongs to Teacher Operations (a later Phase 6 stage). */
export function useTeacherArrangements() {
  const { token } = useAuth();
  const [arrangements, setArrangements] = useState<TeacherArrangement[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
          () => apiRequest<TeacherArrangement[]>('/api/teacher/arrangements', {}, token),
          { force }
        );
        // Normalize at the fetch boundary — see useTeacherSchedule for why.
        setArrangements(Array.isArray(result) ? result : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load arrangements.');
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

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return { arrangements, loading, refreshing, error, handleRefresh };
}
