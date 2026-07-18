import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { OperationsTodaySummary } from '@/lib/types';

const SCOPE = 'ops-today';

/**
 * GET /api/schools/[schoolId]/operations/today — reachable only when this
 * Teacher is currently the effective Operations Head (guardOperationsCapability
 * bearer path); a Teacher who is not returns 403 and this hook surfaces it as
 * a normal error, never a synthesized empty summary.
 */
export function useOperationsToday() {
  const { token, user } = useAuth();
  const schoolId = user?.schoolId;
  const [data, setData] = useState<OperationsTodaySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE),
          CACHE_TTL.OPERATIONS_TODAY,
          () => apiRequest<OperationsTodaySummary>(`/api/schools/${schoolId}/operations/today`, {}, token),
          { force }
        );
        setData(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load today at school.');
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

  return { data, loading, refreshing, error, handleRefresh };
}
