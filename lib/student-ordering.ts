// Natural roll-number ordering, mirrored from the backend's
// src/lib/student-ordering.ts (sortStudentsByRollNumber /
// compareStudentsByRollNumber) so client-rendered rosters never fall back to
// lexical string sort (which would produce 1, 10, 2, 3 instead of 1, 2, 3, 10).
export function compareStudentsByRollNumber(a: { rollNo: string }, b: { rollNo: string }): number {
  const aNum = Number(a.rollNo);
  const bNum = Number(b.rollNo);
  const aIsNumeric = a.rollNo.trim() !== '' && Number.isFinite(aNum);
  const bIsNumeric = b.rollNo.trim() !== '' && Number.isFinite(bNum);

  if (aIsNumeric && bIsNumeric) return aNum - bNum;
  if (aIsNumeric) return -1;
  if (bIsNumeric) return 1;
  return a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true, sensitivity: 'base' });
}

export function sortStudentsByRollNumber<T extends { rollNo: string }>(students: T[]): T[] {
  return [...students].sort(compareStudentsByRollNumber);
}
