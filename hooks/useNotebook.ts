import { useCallback, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { sortStudentsByRollNumber } from '@/lib/student-ordering';
import type { NotebookCheckInput, NotebookRosterEntry } from '@/lib/types';

const SCOPE = 'teacher-notebook';

export function useNotebook() {
  const { token } = useAuth();
  const [roster, setRoster] = useState<NotebookRosterEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<{ sectionId: string; subject: string; examMilestoneId: string } | null>(null);

  const load = useCallback(
    async (sectionId: string, subject: string, examMilestoneId: string, force = false) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      setContext({ sectionId, subject, examMilestoneId });
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE, sectionId, subject, examMilestoneId),
          CACHE_TTL.HOMEWORK,
          () =>
            apiRequest<{ roster: NotebookRosterEntry[] }>(
              `/api/teacher/notebook?sectionId=${encodeURIComponent(sectionId)}&subject=${encodeURIComponent(subject)}&examMilestoneId=${encodeURIComponent(examMilestoneId)}`,
              {},
              token
            ),
          { force }
        );
        setRoster(sortStudentsByRollNumber(result.roster));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load notebook roster.');
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const save = useCallback(
    async (sectionId: string, subject: string, examMilestoneId: string, checks: NotebookCheckInput[]) => {
      if (!token) return false;
      setError(null);
      setSaving(true);
      try {
        await apiRequest('/api/teacher/notebook', { method: 'PATCH', body: JSON.stringify({ sectionId, subject, examMilestoneId, checks }) }, token);
        invalidatePrefix(cacheKey(token, SCOPE, sectionId, subject, examMilestoneId));
        await load(sectionId, subject, examMilestoneId, true);
        return true;
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save notebook checks.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [token, load]
  );

  return { roster, loading, saving, error, context, load, save };
}
