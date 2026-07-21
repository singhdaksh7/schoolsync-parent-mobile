import { isSelfOperationsTarget } from '@/lib/operations-self-protection';

describe('isSelfOperationsTarget', () => {
  it('is true when the target teacherId matches the acting teacher', () => {
    expect(isSelfOperationsTarget('teacher-1', 'teacher-1')).toBe(true);
  });

  it('is false when the target teacherId differs', () => {
    expect(isSelfOperationsTarget('teacher-1', 'teacher-2')).toBe(false);
  });

  it('is false when my own teacherId is not yet known (null/undefined) — never assumes self by omission', () => {
    expect(isSelfOperationsTarget('teacher-1', null)).toBe(false);
    expect(isSelfOperationsTarget('teacher-1', undefined)).toBe(false);
  });
});
