import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { buildAttendanceSubmission } from '@/lib/attendance-submit';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { StudentAttendanceRecord, StudentAttendanceStatus, StudentRosterRow } from '@/lib/types';

export type { StudentAttendanceStatus, StudentRosterRow } from '@/lib/types';

const SCOPE = 'teacher-student-attendance';

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * GET/POST /api/teacher/attendance — class/section STUDENT attendance (not
 * self-attendance). The roster (student list) is supplied by the caller from
 * useTeacherProfile's mentorSection.students, since the attendance routes
 * only return existing Attendance rows for the date, never the class list.
 * Submission is always ONE POST for every edited row — never one request
 * per student, regardless of how many rows changed.
 */
export function useStudentAttendance(roster: { id: string; name: string; rollNo: string }[]) {
  const { token } = useAuth();
  const [date] = useState(todayDateOnly);
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [edits, setEdits] = useState<Record<string, StudentAttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE, date),
          CACHE_TTL.ATTENDANCE,
          () => apiRequest<StudentAttendanceRecord[]>(`/api/teacher/attendance?date=${encodeURIComponent(date)}`, {}, token),
          { force }
        );
        setRecords(result);
        setEdits({});
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load student attendance.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, date]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, date]);

  useForegroundRefresh(useCallback(() => load(), [load]));

  const rows: StudentRosterRow[] = useMemo(() => {
    const byStudentId = new Map(records.map((r) => [r.studentId, r.status]));
    return roster.map((student) => ({
      studentId: student.id,
      name: student.name,
      rollNo: student.rollNo,
      status: edits[student.id] ?? byStudentId.get(student.id) ?? null,
    }));
  }, [roster, records, edits]);

  const setStatus = useCallback((studentId: string, status: StudentAttendanceStatus) => {
    setEdits((prev) => ({ ...prev, [studentId]: status }));
  }, []);

  const hasEdits = Object.keys(edits).length > 0;

  const submit = useCallback(async () => {
    if (!token || !hasEdits) return false;
    setSubmitting(true);
    setError(null);
    try {
      const payload = buildAttendanceSubmission(rows, edits, date);
      await apiRequest('/api/teacher/attendance', { method: 'POST', body: JSON.stringify(payload) }, token);
      invalidatePrefix(cacheKey(token, SCOPE));
      await load(true);
      return true;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit attendance.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [token, hasEdits, rows, edits, date, load]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return { date, rows, setStatus, hasEdits, submit, submitting, loading, refreshing, error, handleRefresh };
}
