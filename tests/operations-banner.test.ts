import { describeOperationsBanner } from '@/lib/operations-banner';

describe('describeOperationsBanner — Teacher Operations self-status banner text', () => {
  it('shows no banner when not currently effective', () => {
    expect(describeOperationsBanner({ roleType: 'TEACHER_OPERATIONS', isEffectiveOperationsHead: false, delegated: false, reasonCode: null })).toBeNull();
    expect(describeOperationsBanner(null)).toBeNull();
    expect(describeOperationsBanner(undefined)).toBeNull();
  });

  it('shows the plain primary-head message when effective and not delegated', () => {
    const message = describeOperationsBanner({
      roleType: 'TEACHER_OPERATIONS',
      isEffectiveOperationsHead: true,
      delegated: false,
      reasonCode: 'AVAILABLE',
    });
    expect(message).toBe('You are managing School Operations today.');
  });

  it('maps a known delegated reasonCode to friendly text, never the raw code', () => {
    const message = describeOperationsBanner({
      roleType: 'TEACHER_OPERATIONS',
      isEffectiveOperationsHead: true,
      delegated: true,
      reasonCode: 'APPROVED_LEAVE',
    });
    expect(message).toBe('You are managing School Operations today because the Primary Operations Head is on approved leave.');
    expect(message).not.toContain('APPROVED_LEAVE');
  });

  it('falls back to a generic delegated message for an unmapped/unknown reasonCode', () => {
    const message = describeOperationsBanner({
      roleType: 'TEACHER_OPERATIONS',
      isEffectiveOperationsHead: true,
      delegated: true,
      reasonCode: 'SOME_FUTURE_CODE',
    });
    expect(message).toBe('You are managing School Operations today because the Primary Operations Head is unavailable.');
  });
});
