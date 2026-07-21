import { computeVisibleWorkModules } from '@/lib/work-modules';
import type { FeatureFlagKey, TeacherPermissionsResponse } from '@/lib/types';

function features(enabled: FeatureFlagKey[]) {
  return (key: FeatureFlagKey) => enabled.includes(key);
}

const UNRESTRICTED: TeacherPermissionsResponse = {
  permissions: [],
  scope: { classIds: [], sectionIds: [], unrestricted: true },
  hasCustomRole: false,
};

describe('computeVisibleWorkModules — no dead cards', () => {
  it('shows every module when all features are enabled and the teacher is unrestricted', () => {
    const modules = computeVisibleWorkModules(features(['HOMEWORK', 'NOTEBOOK_CHECKING', 'REPORT_CARDS']), UNRESTRICTED);
    expect(modules.map((m) => m.key).sort()).toEqual(['homework', 'marks', 'notebook', 'report-cards'].sort());
  });

  it('hides Homework when HOMEWORK feature is disabled', () => {
    const modules = computeVisibleWorkModules(features(['NOTEBOOK_CHECKING', 'REPORT_CARDS']), UNRESTRICTED);
    expect(modules.map((m) => m.key)).not.toContain('homework');
  });

  it('hides Notebook when NOTEBOOK_CHECKING feature is disabled', () => {
    const modules = computeVisibleWorkModules(features(['HOMEWORK', 'REPORT_CARDS']), UNRESTRICTED);
    expect(modules.map((m) => m.key)).not.toContain('notebook');
  });

  it('hides Report Cards when REPORT_CARDS feature is disabled', () => {
    const modules = computeVisibleWorkModules(features(['HOMEWORK', 'NOTEBOOK_CHECKING']), UNRESTRICTED);
    expect(modules.map((m) => m.key)).not.toContain('report-cards');
  });

  it('Marks has no feature gate — only permission — so it shows even with zero features enabled', () => {
    const modules = computeVisibleWorkModules(features([]), UNRESTRICTED);
    expect(modules.map((m) => m.key)).toContain('marks');
  });

  it('hides a module when the custom-role permission denies VIEW, even if the feature is enabled', () => {
    const restricted: TeacherPermissionsResponse = {
      permissions: [{ module: 'HOMEWORK', action: 'CREATE', allowed: true }], // no HOMEWORK:VIEW granted
      scope: { classIds: [], sectionIds: [], unrestricted: false },
      hasCustomRole: true,
    };
    const modules = computeVisibleWorkModules(features(['HOMEWORK']), restricted);
    expect(modules.map((m) => m.key)).not.toContain('homework');
  });

  it('every visible module points at a route that actually exists in this app (sanity list)', () => {
    const modules = computeVisibleWorkModules(features(['HOMEWORK', 'NOTEBOOK_CHECKING', 'REPORT_CARDS']), UNRESTRICTED);
    const knownRoutes = ['/teacher/work/homework', '/teacher/work/marks', '/teacher/work/notebook', '/teacher/work/report-cards'];
    for (const module of modules) expect(knownRoutes).toContain(module.route);
  });
});
