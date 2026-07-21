import { findInvalidMarkStudentIds } from '@/lib/marks-validation';

function draftMap(values: Record<string, string>) {
  return (studentId: string) => values[studentId] ?? '';
}

describe('findInvalidMarkStudentIds — client-side max-marks guard', () => {
  it('flags a value above the maximum', () => {
    const invalid = findInvalidMarkStudentIds(['s1', 's2'], draftMap({ s1: '999', s2: '50' }), 100);
    expect(invalid.has('s1')).toBe(true);
    expect(invalid.has('s2')).toBe(false);
  });

  it('flags a negative value', () => {
    const invalid = findInvalidMarkStudentIds(['s1'], draftMap({ s1: '-5' }), 100);
    expect(invalid.has('s1')).toBe(true);
  });

  it('flags a non-numeric value', () => {
    const invalid = findInvalidMarkStudentIds(['s1'], draftMap({ s1: 'abc' }), 100);
    expect(invalid.has('s1')).toBe(true);
  });

  it('does not flag an empty draft (not yet entered)', () => {
    const invalid = findInvalidMarkStudentIds(['s1'], draftMap({}), 100);
    expect(invalid.size).toBe(0);
  });

  it('never flags anything when no maximum has been entered yet (null)', () => {
    const invalid = findInvalidMarkStudentIds(['s1'], draftMap({ s1: '999999' }), null);
    expect(invalid.size).toBe(0);
  });

  it('accepts a value exactly at the maximum', () => {
    const invalid = findInvalidMarkStudentIds(['s1'], draftMap({ s1: '100' }), 100);
    expect(invalid.has('s1')).toBe(false);
  });
});
