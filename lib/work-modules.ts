// Pure Work-hub module visibility computation, factored out of
// app/teacher/work/index.tsx. A module only shows when it has a real,
// bearer-reachable mobile screen AND passes its feature+permission gate —
// never a card that leads to "not implemented".
import { can } from './teacher-permissions';
import type { FeatureFlagKey, TeacherPermissionsResponse } from './types';

export type WorkModule = {
  key: 'homework' | 'marks' | 'notebook' | 'report-cards';
  title: string;
  description: string;
  route: string;
};

const MODULES: (WorkModule & { feature: FeatureFlagKey | null; permissionModule: string; permissionAction: string })[] = [
  { key: 'homework', title: 'Homework', description: 'Create, edit, and review homework submissions.', route: '/teacher/work/homework', feature: 'HOMEWORK', permissionModule: 'HOMEWORK', permissionAction: 'VIEW' },
  { key: 'marks', title: 'Marks', description: 'Enter and review exam marks for your sections.', route: '/teacher/work/marks', feature: null, permissionModule: 'MARKS', permissionAction: 'VIEW' },
  { key: 'notebook', title: 'Notebook Checking', description: 'Mark notebook checks for an exam milestone.', route: '/teacher/work/notebook', feature: 'NOTEBOOK_CHECKING', permissionModule: 'NOTEBOOK', permissionAction: 'VIEW' },
  { key: 'report-cards', title: 'Report Cards', description: 'Generate, publish, and download report cards.', route: '/teacher/work/report-cards', feature: 'REPORT_CARDS', permissionModule: 'REPORT_CARDS', permissionAction: 'VIEW' },
];

export function computeVisibleWorkModules(
  hasFeature: (key: FeatureFlagKey) => boolean,
  permissions: TeacherPermissionsResponse | null | undefined
): WorkModule[] {
  return MODULES.filter((module) => (module.feature ? hasFeature(module.feature) : true) && can(permissions, module.permissionModule, module.permissionAction)).map(
    ({ key, title, description, route }) => ({ key, title, description, route })
  );
}
