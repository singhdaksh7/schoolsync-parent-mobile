// Pure payload-building logic for POST /api/teacher/attendance, factored out
// of hooks/useStudentAttendance.ts so the request shape is unit-testable
// without rendering the hook.
import type { StudentAttendanceStatus, StudentAttendanceSubmitInput, StudentRosterRow } from './types';

/** Only rows the teacher actually edited this session are submitted — not
 * the whole roster — and always as ONE payload, never one call per row. */
export function buildAttendanceSubmission(
  rows: StudentRosterRow[],
  edits: Record<string, StudentAttendanceStatus>,
  date: string
): StudentAttendanceSubmitInput {
  const records = rows
    .filter((row) => edits[row.studentId] !== undefined && row.status)
    .map((row) => ({ id: row.studentId, status: row.status as StudentAttendanceStatus }));
  return { date, records };
}
