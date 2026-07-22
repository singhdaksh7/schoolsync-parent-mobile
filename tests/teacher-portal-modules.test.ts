import { computeVisibleTeacherPortalModules } from '@/lib/teacher-portal-modules';
import type { FeatureFlagKey } from '@/lib/types';

function features(enabled: FeatureFlagKey[]) {
  return (key: FeatureFlagKey) => enabled.includes(key);
}

describe('computeVisibleTeacherPortalModules — no dead tiles', () => {
  it('shows every base module (and no Operations tile) when ATTENDANCE is enabled and the teacher is not Operations Head', () => {
    const modules = computeVisibleTeacherPortalModules(features(['ATTENDANCE']), false);
    expect(modules.map((m) => m.key).sort()).toEqual(
      ['profile', 'schedule', 'attendance', 'work', 'substitutions', 'transport'].sort()
    );
  });

  it('hides Attendance when the ATTENDANCE feature is disabled', () => {
    const modules = computeVisibleTeacherPortalModules(features([]), false);
    expect(modules.map((m) => m.key)).not.toContain('attendance');
  });

  it('Profile, Schedule, Work, Substitutions, and Transport have no feature gate — they show with zero features enabled', () => {
    const modules = computeVisibleTeacherPortalModules(features([]), false);
    const keys = modules.map((m) => m.key);
    expect(keys).toContain('profile');
    expect(keys).toContain('schedule');
    expect(keys).toContain('work');
    expect(keys).toContain('substitutions');
    expect(keys).toContain('transport');
  });

  it('adds an Operations tile only when the teacher is the effective Operations Head', () => {
    const notHead = computeVisibleTeacherPortalModules(features(['ATTENDANCE']), false);
    const head = computeVisibleTeacherPortalModules(features(['ATTENDANCE']), true);
    expect(notHead.map((m) => m.key)).not.toContain('operations');
    expect(head.map((m) => m.key)).toContain('operations');
  });

  it('every visible module points at a route that actually exists in this app (sanity list)', () => {
    const modules = computeVisibleTeacherPortalModules(features(['ATTENDANCE']), true);
    const knownRoutes = [
      '/teacher/profile',
      '/teacher/schedule',
      '/teacher/attendance',
      '/teacher/work',
      '/teacher/substitutions',
      '/teacher/transport',
      '/teacher/operations',
    ];
    for (const module of modules) expect(knownRoutes).toContain(module.route);
  });
});
