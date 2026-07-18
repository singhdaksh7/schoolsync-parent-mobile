import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { OperationsActivityItem, OperationsActivityResponse } from '@/lib/types';

const SCOPE = 'ops-activity';
const PAGE_SIZE = 20;

/** GET /api/schools/[schoolId]/operations/activity — paginated, page-appending on loadMore. */
export function useOperationsActivity() {
  const { token, user } = useAuth();
  const schoolId = user?.schoolId;
  const [items, setItems] = useState<OperationsActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, force: boolean) => {
      if (!token || !schoolId) return;
      const isFirstPage = targetPage === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE, String(targetPage)),
          CACHE_TTL.ACTIVITY,
          () => apiRequest<OperationsActivityResponse>(`/api/schools/${schoolId}/operations/activity?page=${targetPage}&limit=${PAGE_SIZE}`, {}, token),
          { force }
        );
        setItems((prev) => (isFirstPage ? result.data : [...prev, ...result.data]));
        setPage(targetPage);
        setHasNextPage(result.pagination.hasNextPage);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load activity.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [token, schoolId]
  );

  useEffect(() => {
    load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, schoolId]);

  useForegroundRefresh(useCallback(() => load(1, true), [load]));

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(1, true);
  }, [load]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasNextPage) return;
    load(page + 1, false);
  }, [load, loadingMore, hasNextPage, page]);

  return { items, loading, loadingMore, refreshing, error, hasNextPage, handleRefresh, loadMore };
}
