import { buildAttendanceSubmission } from '@/lib/attendance-submit';
import type { StudentRosterRow } from '@/lib/types';

const roster: StudentRosterRow[] = [
  { studentId: 's1', name: 'Aarav', rollNo: '1', status: 'PRESENT' },
  { studentId: 's2', name: 'Bina', rollNo: '2', status: null },
  { studentId: 's3', name: 'Chetan', rollNo: '3', status: 'ABSENT' },
];

describe('buildAttendanceSubmission — one-request student attendance payload', () => {
  it('includes only rows the teacher actually edited this session', () => {
    const edits = { s1: 'PRESENT' as const, s3: 'ABSENT' as const };
    const payload = buildAttendanceSubmission(roster, edits, '2026-07-06');
    expect(payload.date).toBe('2026-07-06');
    expect(payload.records).toEqual([
      { id: 's1', status: 'PRESENT' },
      { id: 's3', status: 'ABSENT' },
    ]);
  });

  it('includes a row once its resolved status reflects the edit (rows come from the hook\'s edit-merged view, not the raw roster)', () => {
    const rowsWithEditApplied: StudentRosterRow[] = roster.map((row) => (row.studentId === 's2' ? { ...row, status: 'LATE' } : row));
    const edits = { s2: 'LATE' as const };
    const payload = buildAttendanceSubmission(rowsWithEditApplied, edits, '2026-07-06');
    expect(payload.records).toEqual([{ id: 's2', status: 'LATE' }]);
  });

  it('excludes a studentId present in `edits` if its row has no resolved status at all (defensive — should not happen via the real rows memo)', () => {
    const edits = { s2: 'LATE' as const };
    const payload = buildAttendanceSubmission(roster, edits, '2026-07-06'); // roster's s2.status is still null here
    expect(payload.records).toEqual([]);
  });

  it('produces a single flat payload regardless of roster size (never one entry per network call — this IS the one request)', () => {
    const bigRoster: StudentRosterRow[] = Array.from({ length: 50 }, (_, i) => ({
      studentId: `s${i}`,
      name: `Student ${i}`,
      rollNo: String(i),
      status: 'PRESENT',
    }));
    const edits = Object.fromEntries(bigRoster.map((r) => [r.studentId, 'PRESENT' as const]));
    const payload = buildAttendanceSubmission(bigRoster, edits, '2026-07-06');
    expect(payload.records).toHaveLength(50);
  });

  it('returns an empty records array when nothing was edited', () => {
    const payload = buildAttendanceSubmission(roster, {}, '2026-07-06');
    expect(payload.records).toEqual([]);
  });
});
