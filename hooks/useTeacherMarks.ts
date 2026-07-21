import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import type { ExamResultRow, TeacherExamItem, TeacherExamListResponse } from '@/lib/types';

const SCOPE = 'teacher-marks';
const EXAMS_SCOPE = 'teacher-exams';

/**
 * GET/POST /api/teacher/results — marks. examId and sectionId are always
 * explicit, required inputs — never inferred or defaulted client-side.
 * The exam itself is selected from GET /api/teacher/exams (school-wide list,
 * MARKS:VIEW-gated, never a "current/default" exam) — the teacher always
 * taps one explicitly rather than typing a raw exam id.
 */
export function useTeacherMarks() {
  const { token } = useAuth();
  const [results, setResults] = useState<ExamResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<{ examId: string; sectionId: string } | null>(null);
  const [exams, setExams] = useState<TeacherExamItem[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examsError, setExamsError] = useState<string | null>(null);

  const loadExams = useCallback(
    async (force = false) => {
      if (!token) return;
      setExamsLoading(true);
      setExamsError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, EXAMS_SCOPE),
          CACHE_TTL.REPORT_CARDS,
          () => apiRequest<TeacherExamListResponse>('/api/teacher/exams', {}, token),
          { force }
        );
        setExams(result.exams);
      } catch (loadError) {
        setExamsError(loadError instanceof Error ? loadError.message : 'Failed to load exams.');
      } finally {
        setExamsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const load = useCallback(
    async (examId: string, sectionId: string, force = false) => {
      if (!token || !examId.trim() || !sectionId.trim()) return;
      setLoading(true);
      setError(null);
      setContext({ examId, sectionId });
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE, examId, sectionId),
          CACHE_TTL.REPORT_CARDS,
          () =>
            apiRequest<ExamResultRow[]>(
              `/api/teacher/results?examId=${encodeURIComponent(examId)}&sectionId=${encodeURIComponent(sectionId)}`,
              {},
              token
            ),
          { force }
        );
        setResults(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load marks.');
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const save = useCallback(
    async (examId: string, sectionId: string, entries: ExamResultRow[]) => {
      if (!token) return false;
      setError(null);
      setSaving(true);
      try {
        await apiRequest('/api/teacher/results', { method: 'POST', body: JSON.stringify({ examId, sectionId, results: entries }) }, token);
        invalidatePrefix(cacheKey(token, SCOPE, examId, sectionId));
        await load(examId, sectionId, true);
        return true;
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save marks.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [token, load]
  );

  return { results, loading, saving, error, context, load, save, exams, examsLoading, examsError, loadExams };
}
