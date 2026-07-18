// Pure mapping from GET /api/teacher/operational-roles/self-status's
// reasonCode (schoolsync/src/lib/operational-role-resolver.ts
// AvailabilityReasonCode) to a restrained, human-readable banner message.
// Factored out for unit testing without rendering a screen.
import type { TeacherOperationsSelfStatus } from './types';

const REASON_TEXT: Record<string, string> = {
  APPROVED_LEAVE: 'the Primary Operations Head is on approved leave',
  MARKED_ABSENT: 'the Primary Operations Head was marked absent today',
  TEACHER_DELETED: 'the previous Operations Head is no longer with the school',
  ASSIGNMENT_DISABLED: 'the assignment ahead of you is not currently active',
  ASSIGNMENT_NOT_STARTED: 'the assignment ahead of you has not started yet',
  ASSIGNMENT_ENDED: 'the assignment ahead of you has ended',
  NO_ASSIGNMENTS_CONFIGURED: 'no Operations assignment is configured ahead of you',
  NO_AVAILABLE_ASSIGNEE: 'no one else is currently available',
  FIRST_AVAILABLE: 'you are first in the coverage order today',
  AVAILABLE: 'you are the assigned Operations Head',
};

/** Returns null when no banner should show (not currently effective). Never
 * surfaces the raw reasonCode as the primary message. */
export function describeOperationsBanner(status: TeacherOperationsSelfStatus | null | undefined): string | null {
  if (!status?.isEffectiveOperationsHead) return null;
  if (!status.delegated) return 'You are managing School Operations today.';

  const reason = status.reasonCode ? REASON_TEXT[status.reasonCode] : null;
  return reason
    ? `You are managing School Operations today because ${reason}.`
    : 'You are managing School Operations today because the Primary Operations Head is unavailable.';
}
