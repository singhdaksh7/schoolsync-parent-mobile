import { can } from '@/lib/teacher-permissions';
import type { TeacherPermissionsResponse } from '@/lib/types';

function response(overrides: Partial<TeacherPermissionsResponse>): TeacherPermissionsResponse {
  return {
    permissions: [],
    scope: { classIds: [], sectionIds: [], unrestricted: true },
    hasCustomRole: false,
    ...overrides,
  };
}

describe('can() — mirrors authorizeTeacher\'s unrestricted-by-default rule', () => {
  it('fails open (allowed) when the bootstrap has not loaded yet', () => {
    expect(can(null, 'HOMEWORK', 'CREATE')).toBe(true);
    expect(can(undefined, 'HOMEWORK', 'CREATE')).toBe(true);
  });

  it('allows everything when the teacher has no custom role assignment at all', () => {
    const data = response({ hasCustomRole: false, permissions: [], scope: { classIds: [], sectionIds: [], unrestricted: true } });
    expect(can(data, 'HOMEWORK', 'CREATE')).toBe(true);
    expect(can(data, 'MARKS', 'ENTER', { sectionId: 'sec-1' })).toBe(true);
  });

  it('denies an action with no matching permission once a custom role exists', () => {
    const data = response({
      hasCustomRole: true,
      permissions: [{ module: 'HOMEWORK', action: 'VIEW', allowed: true }],
      scope: { classIds: [], sectionIds: [], unrestricted: true },
    });
    expect(can(data, 'HOMEWORK', 'CREATE')).toBe(false);
  });

  it('denies an explicitly disallowed permission', () => {
    const data = response({
      hasCustomRole: true,
      permissions: [{ module: 'HOMEWORK', action: 'CREATE', allowed: false }],
    });
    expect(can(data, 'HOMEWORK', 'CREATE')).toBe(false);
  });

  it('respects section scope when restricted and no MANAGE_ALL', () => {
    const data = response({
      hasCustomRole: true,
      permissions: [{ module: 'HOMEWORK', action: 'CREATE', allowed: true }],
      scope: { classIds: [], sectionIds: ['sec-1'], unrestricted: false },
    });
    expect(can(data, 'HOMEWORK', 'CREATE', { sectionId: 'sec-1' })).toBe(true);
    expect(can(data, 'HOMEWORK', 'CREATE', { sectionId: 'sec-2' })).toBe(false);
  });

  it('MANAGE_ALL lets the teacher act outside their assigned scope', () => {
    const data = response({
      hasCustomRole: true,
      permissions: [
        { module: 'HOMEWORK', action: 'CREATE', allowed: true },
        { module: 'HOMEWORK', action: 'MANAGE_ALL', allowed: true },
      ],
      scope: { classIds: [], sectionIds: ['sec-1'], unrestricted: false },
    });
    expect(can(data, 'HOMEWORK', 'CREATE', { sectionId: 'sec-9' })).toBe(true);
  });

  it('unrestricted scope skips the section/class check even with a custom role', () => {
    const data = response({
      hasCustomRole: true,
      permissions: [{ module: 'HOMEWORK', action: 'CREATE', allowed: true }],
      scope: { classIds: [], sectionIds: [], unrestricted: true },
    });
    expect(can(data, 'HOMEWORK', 'CREATE', { sectionId: 'anything' })).toBe(true);
  });
});
