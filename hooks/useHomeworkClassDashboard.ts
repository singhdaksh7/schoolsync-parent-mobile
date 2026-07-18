import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import type { HomeworkDashboardResponse } from '@/lib/types';

const SCOPE = 'teacher-homework-dashboard';

/** GET /api/teacher/homework/class-dashboard — a bounded per-section/subject
 * completion summary, not a general analytics dashboard. Only shown as a
 * compact card within the homework detail screen, using metrics the route
 * already returns (never invented). */
export function useHomeworkClassDashboard(sectionId: string | null, subject: string | null) {
  const { token } = useAuth();
  const [data, setData] = useState<HomeworkDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token || !sectionId || !subject) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE, sectionId, subject),
          CACHE_TTL.HOMEWORK,
          () =>
            apiRequest<HomeworkDashboardResponse>(
              `/api/teacher/homework/class-dashboard?sectionId=${encodeURIComponent(sectionId)}&subject=${encodeURIComponent(subject)}`,
              {},
              token
            ),
          { force }
        );
        setData(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load class summary.');
      } finally {
        setLoading(false);
      }
    },
    [token, sectionId, subject]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sectionId, subject]);

  return { data, loading, error, refresh: () => load(true) };
}
