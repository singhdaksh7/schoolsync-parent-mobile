// Pure client-side max-marks validation, factored out of
// app/teacher/work/marks.tsx. The backend caps marks at the exam's maxMarks
// silently (Math.min) — this must not be the ONLY defense; the mobile UX
// blocks an obviously-over-max value before submit.

export function findInvalidMarkStudentIds(
  studentIds: string[],
  draftFor: (studentId: string) => string,
  maxMarks: number | null
): Set<string> {
  const invalid = new Set<string>();
  if (maxMarks === null) return invalid;
  for (const studentId of studentIds) {
    const raw = draftFor(studentId);
    if (!raw.trim()) continue;
    const value = Number(raw);
    if (Number.isNaN(value) || value < 0 || value > maxMarks) invalid.add(studentId);
  }
  return invalid;
}
