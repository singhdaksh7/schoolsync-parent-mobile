import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { uploadManagedFile, type PickedFile } from '@/lib/managed-upload';
import { useParentSelection } from '@/lib/parent-selection-context';
import { useForegroundRefresh } from './useForegroundRefresh';
import type {
  AnnouncementItem,
  AttendanceItem,
  Child,
  HomeworkItem,
  MarkItem,
  PendingFeeItem,
  ReportCardItem,
  TimetableItem,
} from '@/lib/types';

const SCOPE = 'parent';

async function loadStudentData(token: string, studentId: string, force: boolean) {
  const query = `?studentId=${encodeURIComponent(studentId)}`;
  const [attendance, marks, reportCards, timetable, homework] = await Promise.all([
    cachedFetch(
      cacheKey(token, SCOPE, 'attendance', studentId),
      CACHE_TTL.ATTENDANCE,
      () => apiRequest<{ attendance: AttendanceItem[] }>(`/api/parent/attendance${query}`, {}, token).then((r) => r.attendance || []),
      { force }
    ),
    // No explicit TTL is named for exam marks in the Phase 6 cache guidance;
    // treated as report-card-adjacent (slow-changing, exam-cycle data).
    cachedFetch(
      cacheKey(token, SCOPE, 'marks', studentId),
      CACHE_TTL.REPORT_CARDS,
      () => apiRequest<{ marks: MarkItem[] }>(`/api/parent/marks${query}`, {}, token).then((r) => r.marks || []),
      { force }
    ),
    cachedFetch(
      cacheKey(token, SCOPE, 'report-cards', studentId),
      CACHE_TTL.REPORT_CARDS,
      () => apiRequest<{ reportCards: ReportCardItem[] }>(`/api/parent/report-cards${query}`, {}, token).then((r) => r.reportCards || []),
      { force }
    ),
    cachedFetch(
      cacheKey(token, SCOPE, 'timetable', studentId),
      CACHE_TTL.TIMETABLE,
      () => apiRequest<{ timetable: TimetableItem[] }>(`/api/parent/timetable${query}`, {}, token).then((r) => r.timetable || []),
      { force }
    ),
    cachedFetch(
      cacheKey(token, SCOPE, 'homework', studentId),
      CACHE_TTL.HOMEWORK,
      () => apiRequest<{ homework: HomeworkItem[] }>(`/api/parent/homework${query}`, {}, token).then((r) => r.homework || []),
      { force }
    ),
  ]);
  return { attendance, marks, reportCards, timetable, homework };
}

export function useParentDashboard() {
  const { token } = useAuth();
  const { selectedStudentId, setSelectedStudentId } = useParentSelection();
  const [children, setChildren] = useState<Child[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [marks, setMarks] = useState<MarkItem[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardItem[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [pendingFees, setPendingFees] = useState<PendingFeeItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingHomeworkId, setSubmittingHomeworkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attendanceSummary = useMemo(() => {
    return attendance.reduce(
      (acc, item) => {
        if (item.status === 'PRESENT') acc.present += 1;
        if (item.status === 'ABSENT') acc.absent += 1;
        if (item.status === 'LATE') acc.late += 1;
        return acc;
      },
      { present: 0, absent: 0, late: 0 }
    );
  }, [attendance]);

  const load = useCallback(
    async (preferredStudentId?: string | null, force = false) => {
      if (!token) return;
      setLoadingData(true);
      setError(null);
      try {
        const [childrenRes, announcementsList, feesList] = await Promise.all([
          cachedFetch(
            cacheKey(token, SCOPE, 'children'),
            CACHE_TTL.PROFILE,
            () => apiRequest<{ children: Child[] }>('/api/parent/children', {}, token).then((r) => r.children || []),
            { force }
          ),
          cachedFetch(
            cacheKey(token, SCOPE, 'announcements'),
            CACHE_TTL.ANNOUNCEMENTS,
            () => apiRequest<{ announcements: AnnouncementItem[] }>('/api/parent/announcements', {}, token).then((r) => r.announcements || []),
            { force }
          ),
          cachedFetch(
            cacheKey(token, SCOPE, 'fees'),
            CACHE_TTL.FEES,
            () => apiRequest<{ pendingFees: PendingFeeItem[] }>('/api/parent/fees', {}, token).then((r) => r.pendingFees || []),
            { force }
          ),
        ]);

        const defaultStudentId =
          preferredStudentId && childrenRes.some((child) => child.id === preferredStudentId)
            ? preferredStudentId
            : (childrenRes[0]?.id ?? null);

        setChildren(childrenRes);
        setAnnouncements(announcementsList);
        setPendingFees(feesList);
        setSelectedStudentId(defaultStudentId);

        if (defaultStudentId) {
          const studentData = await loadStudentData(token, defaultStudentId, force);
          setAttendance(studentData.attendance);
          setMarks(studentData.marks);
          setReportCards(studentData.reportCards);
          setTimetable(studentData.timetable);
          setHomework(studentData.homework);
        } else {
          setAttendance([]);
          setMarks([]);
          setReportCards([]);
          setTimetable([]);
          setHomework([]);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard.');
      } finally {
        setLoadingData(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    // Prefer whatever child is already selected in the shared
    // ParentSelectionContext (e.g. the user switched children on the grid
    // landing screen, then opened a tile) over silently resetting to the
    // first child on every screen mount.
    load(selectedStudentId);
    // Runs once per mount (i.e. once per navigation into a parent screen); `load`
    // is stable per-token via useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Returning from background reconsiders staleness (cachedFetch's TTL, not a
  // forced refetch) — never a full-app refetch, never a re-login.
  useForegroundRefresh(
    useCallback(() => {
      load(selectedStudentId);
    }, [load, selectedStudentId])
  );

  const handleChildChange = useCallback(
    async (studentId: string) => {
      if (!token) return;
      setSelectedStudentId(studentId);
      setLoadingData(true);
      setError(null);
      try {
        const studentData = await loadStudentData(token, studentId, false);
        setAttendance(studentData.attendance);
        setMarks(studentData.marks);
        setReportCards(studentData.reportCards);
        setTimetable(studentData.timetable);
        setHomework(studentData.homework);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load student data.');
      } finally {
        setLoadingData(false);
      }
    },
    [token]
  );

  /**
   * Managed upload: the file is POSTed to .../attachment first (returns a
   * SCOPED_PRIVATE file id), then .../submit is called with attachmentFileId
   * — never a raw pasted URL. Mirrors the Teacher attachment upload flow via
   * the shared uploadManagedFile helper.
   */
  const handleSubmitHomework = useCallback(
    async (item: HomeworkItem, file: PickedFile) => {
      if (!token) return;
      setSubmittingHomeworkId(item.id);
      setError(null);
      try {
        const uploaded = await uploadManagedFile(
          token,
          `/api/parent/homework/${item.homeworkId}/attachment?studentId=${encodeURIComponent(item.studentId)}`,
          file
        );
        await apiRequest(
          `/api/parent/homework/${item.homeworkId}/submit`,
          { method: 'POST', body: JSON.stringify({ studentId: item.studentId, attachmentFileId: uploaded.id }) },
          token
        );
        if (selectedStudentId) {
          // The submission just changed server state — bypass the homework
          // TTL for this one resource instead of invalidating everything.
          invalidatePrefix(cacheKey(token, SCOPE, 'homework', selectedStudentId));
          const studentData = await loadStudentData(token, selectedStudentId, true);
          setAttendance(studentData.attendance);
          setMarks(studentData.marks);
          setReportCards(studentData.reportCards);
          setTimetable(studentData.timetable);
          setHomework(studentData.homework);
        }
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Failed to submit homework.');
      } finally {
        setSubmittingHomeworkId(null);
      }
    },
    [token, selectedStudentId]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(selectedStudentId, true);
  }, [load, selectedStudentId]);

  return {
    children,
    selectedStudentId,
    attendance,
    attendanceSummary,
    marks,
    reportCards,
    timetable,
    homework,
    announcements,
    pendingFees,
    loadingData,
    refreshing,
    submittingHomeworkId,
    error,
    handleChildChange,
    handleSubmitHomework,
    handleRefresh,
  };
}
