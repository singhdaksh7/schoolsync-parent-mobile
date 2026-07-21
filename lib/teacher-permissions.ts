// Client-side mirror of schoolsync's src/lib/teacher-authorization.ts
// `authorizeTeacher` — same rules, same field names, so this is a UI hint
// only (never authority). Kept in sync manually since this is a separate
// repo with no shared package; the backend re-checks on every actual route.
import type { TeacherPermissionsResponse } from './types';

export type PermissionTarget = { sectionId?: string; classId?: string };

/**
 * Mirrors authorizeTeacher's "unrestricted-by-default" rule: a teacher with
 * no custom TeacherRoleAssignment rows at all (`hasCustomRole: false`) keeps
 * full legacy access regardless of `permissions`/`scope` contents. Only once
 * a teacher has at least one custom role assignment does the specific
 * permission + class/section scope actually narrow access.
 */
export function can(data: TeacherPermissionsResponse | null | undefined, module: string, action: string, target?: PermissionTarget): boolean {
  // Not loaded yet, or the TEACHER_PERMISSIONS module is off for this school
  // (the route 403s and the hook surfaces `unavailable`, not this shape) —
  // fail open; the backend's own check on the actual route is authoritative.
  if (!data) return true;
  if (!data.hasCustomRole) return true;

  const match = data.permissions.find((p) => p.module === module && p.action === action);
  if (!match || !match.allowed) return false;

  const hasManageAll =
    action !== 'MANAGE_ALL' && data.permissions.some((p) => p.module === module && p.action === 'MANAGE_ALL' && p.allowed);

  if (!data.scope.unrestricted && !hasManageAll && target) {
    const sectionOk = target.sectionId ? data.scope.sectionIds.includes(target.sectionId) : true;
    const classOk = target.classId ? data.scope.classIds.includes(target.classId) : true;
    return sectionOk && classOk;
  }

  return true;
}
