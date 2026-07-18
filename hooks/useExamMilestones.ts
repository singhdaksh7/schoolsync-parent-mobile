import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import type { ExamMilestoneItem } from '@/lib/types';

const SCOPE = 'teacher-exam-milestones';

/** GET /api/teacher/exam-milestones — supporting context for Notebook
 * Checking only (NOTEBOOK_CHECKING-gated), not a general exam-context source
 * for Marks. */
export function useExamMilestones() {
  const { token } = useAuth();
  const [milestones, setMilestones] = useState<ExamMilestoneItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE),
          CACHE_TTL.REPORT_CARDS,
          () => apiRequest<{ milestones: ExamMilestoneItem[] }>('/api/teacher/exam-milestones', {}, token),
          { force }
        );
        setMilestones(result.milestones.filter((m) => m.active));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load exam milestones.');
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { milestones, loading, error, refresh: () => load(true) };
}
