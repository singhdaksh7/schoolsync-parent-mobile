import { computeVisibleParentPortalModules } from '@/lib/parent-portal-modules';
import type { FeatureFlagKey } from '@/lib/types';

function features(enabled: FeatureFlagKey[]) {
  return (key: FeatureFlagKey) => enabled.includes(key);
}

describe('computeVisibleParentPortalModules — no dead tiles', () => {
  it('shows every module when all its features are enabled', () => {
    const modules = computeVisibleParentPortalModules(features(['FEES', 'HOMEWORK', 'ATTENDANCE', 'REPORT_CARDS']));
    expect(modules.map((m) => m.key).sort()).toEqual(
      ['fees', 'homework', 'attendance', 'marks', 'report-cards', 'timetable', 'announcements'].sort()
    );
  });

  it('hides Fees when the FEES feature is disabled', () => {
    const modules = computeVisibleParentPortalModules(features(['HOMEWORK', 'ATTENDANCE', 'REPORT_CARDS']));
    expect(modules.map((m) => m.key)).not.toContain('fees');
  });

  it('hides Homework when the HOMEWORK feature is disabled', () => {
    const modules = computeVisibleParentPortalModules(features(['FEES', 'ATTENDANCE', 'REPORT_CARDS']));
    expect(modules.map((m) => m.key)).not.toContain('homework');
  });

  it('hides Attendance when the ATTENDANCE feature is disabled', () => {
    const modules = computeVisibleParentPortalModules(features(['FEES', 'HOMEWORK', 'REPORT_CARDS']));
    expect(modules.map((m) => m.key)).not.toContain('attendance');
  });

  it('hides Report Cards when the REPORT_CARDS feature is disabled', () => {
    const modules = computeVisibleParentPortalModules(features(['FEES', 'HOMEWORK', 'ATTENDANCE']));
    expect(modules.map((m) => m.key)).not.toContain('report-cards');
  });

  it('Marks, Timetable, and Announcements have no feature gate — they show with zero features enabled', () => {
    const modules = computeVisibleParentPortalModules(features([]));
    const keys = modules.map((m) => m.key);
    expect(keys).toContain('marks');
    expect(keys).toContain('timetable');
    expect(keys).toContain('announcements');
  });

  it('never includes a Leave or Profile tile — no backing Parent API route exists for either', () => {
    const modules = computeVisibleParentPortalModules(features(['FEES', 'HOMEWORK', 'ATTENDANCE', 'REPORT_CARDS']));
    const keys = modules.map((m) => m.key);
    expect(keys).not.toContain('leave');
    expect(keys).not.toContain('profile');
  });

  it('every visible module points at a route that actually exists in this app (sanity list)', () => {
    const modules = computeVisibleParentPortalModules(features(['FEES', 'HOMEWORK', 'ATTENDANCE', 'REPORT_CARDS']));
    const knownRoutes = [
      '/parent/fees',
      '/parent/homework',
      '/parent/attendance',
      '/parent/marks',
      '/parent/report-cards',
      '/parent/timetable',
      '/parent/announcements',
    ];
    for (const module of modules) expect(knownRoutes).toContain(module.route);
  });
});
