// Pure Teacher Portal grid/search module list, factored out the same way as
// lib/student-portal-modules.ts. A module only appears here when it has a
// real, bearer-reachable mobile screen backed by a real Teacher API route —
// never a tile that leads to "not implemented".
//
// "Work" is one tile covering Homework/Marks/Notebook/Report Cards/Early
// Leave/Full Leave — those already have their own real hub at
// app/teacher/work (see lib/work-modules.ts), so this grid reuses that hub
// instead of flattening it into six separate top-level tiles.
//
// "Operations" only appears when the teacher is the effective Operations
// Head for the school right now (GET
// /api/teacher/operational-roles/self-status) — the backend itself 403s
// every Operations route for anyone else, so this mirrors the same
// permission gate the current dashboard's "Manage Operations" link uses.
import type { FeatureFlagKey } from './types';

export type TeacherPortalModule = {
  key: 'profile' | 'schedule' | 'attendance' | 'work' | 'substitutions' | 'transport' | 'operations';
  title: string;
  icon: string;
  route: string;
};

const BASE_MODULES: (TeacherPortalModule & { feature: FeatureFlagKey | null })[] = [
  { key: 'profile', title: 'Profile', icon: 'person-circle-outline', route: '/teacher/profile', feature: null },
  { key: 'schedule', title: 'Schedule', icon: 'calendar-outline', route: '/teacher/schedule', feature: null },
  { key: 'attendance', title: 'Attendance', icon: 'checkmark-done-circle-outline', route: '/teacher/attendance', feature: 'ATTENDANCE' },
  { key: 'work', title: 'Work', icon: 'briefcase-outline', route: '/teacher/work', feature: null },
  { key: 'substitutions', title: 'Substitutions', icon: 'swap-horizontal-outline', route: '/teacher/substitutions', feature: null },
  // Transport Driver Portal (Phase 2C) — already has its own bottom tab (see
  // app/teacher/_layout.tsx); also surfaced here so it's reachable from the
  // grid/search like every other tab-backed module.
  { key: 'transport', title: 'Transport', icon: 'bus-outline', route: '/teacher/transport', feature: null },
];

export function computeVisibleTeacherPortalModules(
  hasFeature: (key: FeatureFlagKey) => boolean,
  isEffectiveOperationsHead: boolean
): TeacherPortalModule[] {
  const modules = BASE_MODULES.filter((module) => (module.feature ? hasFeature(module.feature) : true)).map(({ key, title, icon, route }) => ({
    key,
    title,
    icon,
    route,
  }));

  if (isEffectiveOperationsHead) {
    modules.push({ key: 'operations', title: 'Operations', icon: 'shield-checkmark-outline', route: '/teacher/operations' });
  }

  return modules;
}
