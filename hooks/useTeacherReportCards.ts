import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import { useJobPoller } from './useJobPoller';
import { isJobResponse } from '@/lib/types';
import type { JobStatusResponse, ReportCardGenerateResponse, TeacherReportCard, TeacherReportCardListResponse } from '@/lib/types';

const SCOPE = 'teacher-report-cards';

export type ActiveReportCardJob = { jobId: string; totalItems: number; deduplicated: boolean; submittedAt: string };

/**
 * GET /api/teacher/report-cards (list), POST .../generate (sync or job
 * mode), POST .../[id]/publish. Queued jobs are tracked via useJobPoller
 * against the Teacher-scoped GET /api/teacher/jobs/[jobId] route (5s/15s/30s
 * cadence, pause/resume on background/foreground, auto-stop on terminal
 * status) — the list is refetched automatically the moment the job reaches
 * COMPLETED, rather than relying on manual pull-to-refresh.
 */
export function useTeacherReportCards() {
  const { token } = useAuth();
  const [reportCards, setReportCards] = useState<TeacherReportCard[]>([]);
  const [mentorSection, setMentorSection] = useState<TeacherReportCardListResponse['mentorSection']>(null);
  const [schemes, setSchemes] = useState<TeacherReportCardListResponse['schemes']>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<ActiveReportCardJob | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE),
          CACHE_TTL.REPORT_CARDS,
          () => apiRequest<TeacherReportCardListResponse>('/api/teacher/report-cards', {}, token),
          { force }
        );
        setReportCards(result.reportCards);
        setMentorSection(result.mentorSection);
        setSchemes(result.schemes);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load report cards.');
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

  const fetchJobStatus = useMemo(() => {
    if (!token || !activeJob) return null;
    const jobId = activeJob.jobId;
    return () => apiRequest<JobStatusResponse>(`/api/teacher/jobs/${jobId}`, {}, token);
  }, [token, activeJob]);

  const jobPoller = useJobPoller(fetchJobStatus);

  useEffect(() => {
    if (!activeJob) return;
    if (jobPoller.result?.status === 'COMPLETED') {
      setActiveJob(null);
      invalidatePrefix(cacheKey(token ?? '', SCOPE));
      load(true);
    } else if (jobPoller.result?.status === 'FAILED' || jobPoller.result?.status === 'CANCELLED') {
      setActiveJob(null);
      setError(jobPoller.result.errorSummary ?? 'Report card generation failed.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobPoller.result?.status]);

  const generate = useCallback(
    async (examSchemeId: string, studentIds?: string[]) => {
      if (!token) return null;
      setError(null);
      setGenerating(true);
      try {
        const result = await apiRequest<ReportCardGenerateResponse>(
          '/api/teacher/report-cards/generate',
          { method: 'POST', body: JSON.stringify({ examSchemeId, studentIds }) },
          token
        );
        if (isJobResponse(result)) {
          setActiveJob({ jobId: result.jobId, totalItems: result.totalItems, deduplicated: result.deduplicated, submittedAt: new Date().toISOString() });
        } else {
          invalidatePrefix(cacheKey(token, SCOPE));
          await load(true);
        }
        return result;
      } catch (generateError) {
        setError(generateError instanceof Error ? generateError.message : 'Failed to generate report cards.');
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [token, load]
  );

  const publish = useCallback(
    async (id: string) => {
      if (!token) return false;
      setError(null);
      setPublishingId(id);
      try {
        await apiRequest(`/api/teacher/report-cards/${id}/publish`, { method: 'POST' }, token);
        invalidatePrefix(cacheKey(token, SCOPE));
        await load(true);
        return true;
      } catch (publishError) {
        setError(publishError instanceof Error ? publishError.message : 'Failed to publish report card.');
        return false;
      } finally {
        setPublishingId(null);
      }
    },
    [token, load]
  );

  const dismissActiveJob = useCallback(() => setActiveJob(null), []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return {
    reportCards,
    mentorSection,
    schemes,
    loading,
    refreshing,
    generating,
    publishingId,
    error,
    activeJob,
    jobStatus: jobPoller.result,
    jobStatusError: jobPoller.error,
    generate,
    publish,
    dismissActiveJob,
    handleRefresh,
  };
}
