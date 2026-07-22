// Pure Parent Portal grid/search module list, factored out the same way as
// lib/student-portal-modules.ts. A module only appears here when it has a
// real, bearer-reachable mobile screen backed by a real Parent API route —
// never a tile that leads to "not implemented".
//
// Dropped vs. the current Parent dashboard: "Leave" (StudentLeaveCard calls
// /api/parent/leave, which has no backend route at all — schoolsync's
// src/app/api/parent/ has no leave/ directory, only /api/student/leave,
// which is gated by student-only auth) and "Profile" (no /api/parent/me or
// /api/parent/profile route exists). Both are pre-existing dead ends on the
// current dashboard, not new drops introduced here.
import type { FeatureFlagKey } from './types';

export type ParentPortalModule = {
  key: 'fees' | 'homework' | 'attendance' | 'marks' | 'report-cards' | 'timetable' | 'announcements' | 'transport';
  title: string;
  icon: string;
  route: string;
};

const MODULES: (ParentPortalModule & { feature: FeatureFlagKey | null })[] = [
  { key: 'fees', title: 'Fees', icon: 'cash-outline', route: '/parent/fees', feature: 'FEES' },
  { key: 'homework', title: 'Homework', icon: 'clipboard-outline', route: '/parent/homework', feature: 'HOMEWORK' },
  { key: 'attendance', title: 'Attendance', icon: 'checkmark-done-circle-outline', route: '/parent/attendance', feature: 'ATTENDANCE' },
  { key: 'marks', title: 'Marks', icon: 'school-outline', route: '/parent/marks', feature: null },
  { key: 'report-cards', title: 'Report Cards', icon: 'document-text-outline', route: '/parent/report-cards', feature: 'REPORT_CARDS' },
  { key: 'timetable', title: 'Timetable', icon: 'calendar-outline', route: '/parent/timetable', feature: null },
  { key: 'announcements', title: 'Announcements', icon: 'megaphone-outline', route: '/parent/announcements', feature: null },
  // Transport Driver Portal (Phase 2C) — no feature flag gate, same as the
  // Driver/Teacher transport tabs; the backend always answers this route.
  { key: 'transport', title: 'Transport', icon: 'bus-outline', route: '/parent/transport', feature: null },
];

export function computeVisibleParentPortalModules(hasFeature: (key: FeatureFlagKey) => boolean): ParentPortalModule[] {
  return MODULES.filter((module) => (module.feature ? hasFeature(module.feature) : true)).map(({ key, title, icon, route }) => ({
    key,
    title,
    icon,
    route,
  }));
}
