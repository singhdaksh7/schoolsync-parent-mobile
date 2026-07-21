import { compareStudentsByRollNumber, sortStudentsByRollNumber } from '@/lib/student-ordering';

describe('sortStudentsByRollNumber', () => {
  it('orders numeric roll numbers naturally, not lexically (1, 2, 3, 10 — never 1, 10, 2, 3)', () => {
    const roster = [{ rollNo: '10' }, { rollNo: '2' }, { rollNo: '1' }, { rollNo: '3' }];
    expect(sortStudentsByRollNumber(roster).map((s) => s.rollNo)).toEqual(['1', '2', '3', '10']);
  });

  it('does not mutate the input array', () => {
    const roster = [{ rollNo: '2' }, { rollNo: '1' }];
    const sorted = sortStudentsByRollNumber(roster);
    expect(sorted).not.toBe(roster);
    expect(roster.map((s) => s.rollNo)).toEqual(['2', '1']);
  });

  it('places non-numeric roll numbers after numeric ones, then falls back to natural string compare', () => {
    const roster = [{ rollNo: '10A' }, { rollNo: '2' }, { rollNo: '10' }, { rollNo: '1' }];
    expect(sortStudentsByRollNumber(roster).map((s) => s.rollNo)).toEqual(['1', '2', '10', '10A']);
  });

  it('is stable for already-sorted input', () => {
    const roster = [{ rollNo: '1' }, { rollNo: '2' }, { rollNo: '3' }];
    expect(sortStudentsByRollNumber(roster).map((s) => s.rollNo)).toEqual(['1', '2', '3']);
  });
});

describe('compareStudentsByRollNumber', () => {
  it('returns 0 for equal numeric roll numbers', () => {
    expect(compareStudentsByRollNumber({ rollNo: '5' }, { rollNo: '5' })).toBe(0);
  });
});
