import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { OperationsAttentionResponse } from '@/lib/types';

const SCOPE = 'ops-attention';

/** GET /api/schools/[schoolId]/operations/attention — Needs Attention + Operations Health. */
export function useOperationsAttention() {
  const { token, user } = useAuth();
  const schoolId = user?.schoolId;
  const [data, setData] = useState<OperationsAttentionResponse | null>(null);
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
          CACHE_TTL.NEEDS_ATTENTION,
          () => apiRequest<OperationsAttentionResponse>(`/api/schools/${schoolId}/operations/attention`, {}, token),
          { force }
        );
        setData(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load needs attention.');
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
