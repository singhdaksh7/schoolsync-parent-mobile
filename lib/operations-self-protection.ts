// Pure client-side UX helper: the backend independently and authoritatively
// enforces SELF_TEACHER_STATUS_MUTATION_FORBIDDEN and
// SELF_LEAVE_APPROVAL_FORBIDDEN regardless of what the client sends — this
// only decides whether to disable the control up front, as a courtesy, never
// as the actual security boundary.
export function isSelfOperationsTarget(targetTeacherId: string, myTeacherId: string | null | undefined): boolean {
  return Boolean(myTeacherId) && targetTeacherId === myTeacherId;
}
