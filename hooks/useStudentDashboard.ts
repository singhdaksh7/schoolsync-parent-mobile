import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type {
  AnnouncementItem,
  AttendanceItem,
  HomeworkItem,
  MarkItem,
  ReportCardItem,
  StudentAttendanceSummary,
  TimetableItem,
} from '@/lib/types';

const SCOPE = 'student';

export function useStudentDashboard() {
  const { token } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<StudentAttendanceSummary | null>(null);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [todayTimetable, setTodayTimetable] = useState<TimetableItem[]>([]);
  const [marks, setMarks] = useState<MarkItem[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        // Each section is independent — use allSettled so one failing endpoint
        // doesn't blank the whole dashboard.
        const [attR, hwR, ttR, mkR, rcR, anR] = await Promise.allSettled([
          cachedFetch(
            cacheKey(token, SCOPE, 'attendance'),
            CACHE_TTL.ATTENDANCE,
            () => apiRequest<{ attendance: AttendanceItem[]; summary: StudentAttendanceSummary }>('/api/student/attendance', {}, token),
            { force }
          ),
          cachedFetch(
            cacheKey(token, SCOPE, 'homework'),
            CACHE_TTL.HOMEWORK,
            () => apiRequest<{ homework: HomeworkItem[] }>('/api/student/homework', {}, token),
            { force }
          ),
          cachedFetch(
            cacheKey(token, SCOPE, 'timetable'),
            CACHE_TTL.TIMETABLE,
            () => apiRequest<{ timetable: TimetableItem[]; today: TimetableItem[] }>('/api/student/timetable', {}, token),
            { force }
          ),
          cachedFetch(cacheKey(token, SCOPE, 'marks'), CACHE_TTL.REPORT_CARDS, () => apiRequest<{ marks: MarkItem[] }>('/api/student/marks', {}, token), {
            force,
          }),
          cachedFetch(
            cacheKey(token, SCOPE, 'report-cards'),
            CACHE_TTL.REPORT_CARDS,
            () => apiRequest<{ reportCards: ReportCardItem[] }>('/api/student/report-cards', {}, token),
            { force }
          ),
          cachedFetch(
            cacheKey(token, SCOPE, 'announcements'),
            CACHE_TTL.ANNOUNCEMENTS,
            () => apiRequest<{ announcements: AnnouncementItem[] }>('/api/student/announcements', {}, token),
            { force }
          ),
        ]);

        if (attR.status === 'fulfilled') {
          setAttendance(attR.value.attendance || []);
          setAttendanceSummary(attR.value.summary ?? null);
        }
        if (hwR.status === 'fulfilled') setHomework(hwR.value.homework || []);
        if (ttR.status === 'fulfilled') {
          setTimetable(ttR.value.timetable || []);
          setTodayTimetable(ttR.value.today || []);
        }
        if (mkR.status === 'fulfilled') setMarks(mkR.value.marks || []);
        if (rcR.status === 'fulfilled') setReportCards(rcR.value.reportCards || []);
        if (anR.status === 'fulfilled') setAnnouncements(anR.value.announcements || []);

        const failures = [attR, hwR, ttR, mkR, rcR, anR].filter(
          (result): result is PromiseRejectedResult => result.status === 'rejected'
        );
        if (failures.length === 6) {
          const reason = failures[0].reason;
          setError(reason instanceof Error ? reason.message : 'Failed to load student dashboard.');
        } else if (failures.length > 0) {
          setError('Some sections could not be loaded. Pull down to refresh and try again.');
        }
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

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return {
    attendance,
    attendanceSummary,
    homework,
    timetable,
    todayTimetable,
    marks,
    reportCards,
    announcements,
    loading,
    refreshing,
    error,
    handleRefresh,
  };
}
