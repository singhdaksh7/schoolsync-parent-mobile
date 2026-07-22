// Pure Student Portal grid/search module list, factored out the same way as
// lib/work-modules.ts. A module only appears here when it has a real,
// bearer-reachable mobile screen backed by a real Student API route — never
// a tile that leads to "not implemented". See the audit notes in the PR body
// for the full list of reference-design menu items that were dropped instead
// (Fee Dues/Fee Paid, Course List/Status, Hour Wise/Cumulative Attendance,
// Exam Details, Revaluation, Hostel, Transport) and why.
import type { FeatureFlagKey } from './types';

export type StudentPortalModule = {
  key: 'profile' | 'timetable' | 'attendance' | 'marks' | 'report-cards' | 'announcements' | 'homework' | 'leave';
  title: string;
  icon: string;
  route: string;
};

const MODULES: (StudentPortalModule & { feature: FeatureFlagKey | null })[] = [
  { key: 'marks', title: 'Marks', icon: 'school-outline', route: '/student/marks', feature: null },
  { key: 'attendance', title: 'Attendance', icon: 'checkmark-done-circle-outline', route: '/student/attendance', feature: 'ATTENDANCE' },
  { key: 'profile', title: 'Profile', icon: 'person-circle-outline', route: '/student/profile', feature: null },
  { key: 'leave', title: 'Leave Requests', icon: 'calendar-clear-outline', route: '/student/leave', feature: null },
  { key: 'timetable', title: 'Timetable', icon: 'calendar-outline', route: '/student/timetable', feature: null },
  { key: 'announcements', title: 'Announcements', icon: 'megaphone-outline', route: '/student/announcements', feature: null },
  { key: 'homework', title: 'Homework', icon: 'document-text-outline', route: '/student/homework', feature: null },
  { key: 'report-cards', title: 'Report Cards', icon: 'reader-outline', route: '/student/report-cards', feature: 'REPORT_CARDS' },
];

/** The 6 modules Stitch's Dashboard "Quick Actions" grid surfaces — a curated
 * subset of the full 8-module menu (Stitch's Menu screen shows all 8; its
 * Dashboard only shows Profile/Timetable/Attendance/Marks/Report
 * Cards/Homework, omitting Leave Requests and Announcements). */
const DASHBOARD_QUICK_ACTION_KEYS: StudentPortalModule['key'][] = [
  'profile',
  'timetable',
  'attendance',
  'marks',
  'report-cards',
  'homework',
];

export function computeDashboardQuickActions(hasFeature: (key: FeatureFlagKey) => boolean): StudentPortalModule[] {
  return computeVisibleStudentPortalModules(hasFeature).filter((module) => DASHBOARD_QUICK_ACTION_KEYS.includes(module.key));
}

export function computeVisibleStudentPortalModules(hasFeature: (key: FeatureFlagKey) => boolean): StudentPortalModule[] {
  return MODULES.filter((module) => (module.feature ? hasFeature(module.feature) : true)).map(({ key, title, icon, route }) => ({
    key,
    title,
    icon,
    route,
  }));
}
