import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { compareStudentsByRollNumber } from '@/lib/student-ordering';
import { useForegroundRefresh } from './useForegroundRefresh';
import type {
  BatchScoreEntry,
  CompletionEntry,
  ScoreSubmissionInput,
  TeacherHomeworkItem,
  TeacherSubmission,
  TeacherSubmissionsResponse,
} from '@/lib/types';

const SCOPE = 'teacher-submissions';
const HOMEWORK_LIST_SCOPE = 'teacher-homework';

/**
 * GET /api/teacher/homework/[id]/submissions (list), PATCH .../submissions/[id]
 * (single scoring), POST .../scores (batch scoring — ONE request for
 * however many rows were edited), PATCH .../completion (per-action
 * completion toggle). All bearer-compatible since the Teacher mobile
 * bearer-compatibility closure.
 */
export function useTeacherSubmissions(homeworkId: string) {
  const { token } = useAuth();
  const [homework, setHomework] = useState<TeacherHomeworkItem | null>(null);
  const [submissions, setSubmissions] = useState<TeacherSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token || !homeworkId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE, homeworkId),
          CACHE_TTL.HOMEWORK,
          () => apiRequest<TeacherSubmissionsResponse>(`/api/teacher/homework/${homeworkId}/submissions`, {}, token),
          { force }
        );
        setHomework(result.homework);
        setSubmissions([...result.submissions].sort((a, b) => compareStudentsByRollNumber(a.student, b.student)));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load submissions.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, homeworkId]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, homeworkId]);

  useForegroundRefresh(useCallback(() => load(), [load]));

  const invalidateRelated = useCallback(() => {
    if (!token) return;
    invalidatePrefix(cacheKey(token, SCOPE, homeworkId));
    invalidatePrefix(cacheKey(token, HOMEWORK_LIST_SCOPE));
  }, [token, homeworkId]);

  const scoreSubmission = useCallback(
    async (submissionId: string, input: ScoreSubmissionInput) => {
      if (!token) return false;
      setError(null);
      setSaving(true);
      try {
        await apiRequest(
          `/api/teacher/homework/${homeworkId}/submissions/${submissionId}`,
          { method: 'PATCH', body: JSON.stringify(input) },
          token
        );
        invalidateRelated();
        await load(true);
        return true;
      } catch (scoreError) {
        setError(scoreError instanceof Error ? scoreError.message : 'Failed to save score.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [token, homeworkId, invalidateRelated, load]
  );

  const saveBatchScores = useCallback(
    async (scores: BatchScoreEntry[]) => {
      if (!token || scores.length === 0) return false;
      setError(null);
      setSaving(true);
      try {
        await apiRequest(`/api/teacher/homework/${homeworkId}/scores`, { method: 'POST', body: JSON.stringify({ scores }) }, token);
        invalidateRelated();
        await load(true);
        return true;
      } catch (batchError) {
        setError(batchError instanceof Error ? batchError.message : 'Failed to save scores.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [token, homeworkId, invalidateRelated, load]
  );

  const setCompletion = useCallback(
    async (completions: CompletionEntry[]) => {
      if (!token || completions.length === 0) return false;
      setError(null);
      setSaving(true);
      try {
        await apiRequest(`/api/teacher/homework/${homeworkId}/completion`, { method: 'PATCH', body: JSON.stringify({ completions }) }, token);
        invalidateRelated();
        await load(true);
        return true;
      } catch (completionError) {
        setError(completionError instanceof Error ? completionError.message : 'Failed to update completion.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [token, homeworkId, invalidateRelated, load]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return { homework, submissions, loading, refreshing, saving, error, scoreSubmission, saveBatchScores, setCompletion, handleRefresh };
}
