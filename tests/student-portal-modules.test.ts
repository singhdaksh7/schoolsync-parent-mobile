import { computeVisibleStudentPortalModules } from '@/lib/student-portal-modules';
import type { FeatureFlagKey } from '@/lib/types';

function features(enabled: FeatureFlagKey[]) {
  return (key: FeatureFlagKey) => enabled.includes(key);
}

describe('computeVisibleStudentPortalModules — no dead tiles', () => {
  it('shows every module when all its features are enabled', () => {
    const modules = computeVisibleStudentPortalModules(features(['ATTENDANCE', 'REPORT_CARDS']));
    expect(modules.map((m) => m.key).sort()).toEqual(['announcements', 'attendance', 'marks', 'profile', 'report-cards', 'timetable'].sort());
  });

  it('hides Attendance when the ATTENDANCE feature is disabled', () => {
    const modules = computeVisibleStudentPortalModules(features(['REPORT_CARDS']));
    expect(modules.map((m) => m.key)).not.toContain('attendance');
  });

  it('hides Report Cards when the REPORT_CARDS feature is disabled', () => {
    const modules = computeVisibleStudentPortalModules(features(['ATTENDANCE']));
    expect(modules.map((m) => m.key)).not.toContain('report-cards');
  });

  it('Profile, Timetable, Marks, and Announcements have no feature gate — they show with zero features enabled', () => {
    const modules = computeVisibleStudentPortalModules(features([]));
    const keys = modules.map((m) => m.key);
    expect(keys).toContain('profile');
    expect(keys).toContain('timetable');
    expect(keys).toContain('marks');
    expect(keys).toContain('announcements');
  });

  it('every visible module points at a route that actually exists in this app (sanity list)', () => {
    const modules = computeVisibleStudentPortalModules(features(['ATTENDANCE', 'REPORT_CARDS']));
    const knownRoutes = [
      '/student/profile',
      '/student/timetable',
      '/student/attendance',
      '/student/marks',
      '/student/report-cards',
      '/student/announcements',
    ];
    for (const module of modules) expect(knownRoutes).toContain(module.route);
  });
});
