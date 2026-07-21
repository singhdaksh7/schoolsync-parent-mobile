// Shared Cost Guard / auth error parser for the SchoolSync mobile app.
// Ported from schoolsync/src/lib/cost-guard-error-handler.ts (web) — kept in
// sync manually since this is a separate repo/app with no shared package.
// Only maps codes that are actually emitted by the frozen mobile-facing
// routes today; see docs/cost-guard-session-architecture.md and the audit in
// the Phase 6 shared-foundation report for which codes are aspirational vs
// real on the mobile bearer-auth path.

export interface CostGuardErrorResult {
  message: string;
  code: string;
  retryAfterSeconds: number | null;
}

interface CostGuardErrorBody {
  error?: string;
  code?: string;
  retryAfterSeconds?: number | string | null;
}

function isCostGuardErrorBody(value: unknown): value is CostGuardErrorBody {
  return typeof value === 'object' && value !== null;
}

export function parseCostGuardError(response: Response, body: unknown): CostGuardErrorResult {
  const parsedBody: CostGuardErrorBody = isCostGuardErrorBody(body) ? body : {};

  let retryAfterSeconds: number | null = null;
  const headerValue = response.headers.get('Retry-After');
  if (headerValue) {
    const parsed = parseInt(headerValue, 10);
    if (!Number.isNaN(parsed)) retryAfterSeconds = parsed;
  }
  if (parsedBody.retryAfterSeconds !== undefined && parsedBody.retryAfterSeconds !== null) {
    retryAfterSeconds = Number(parsedBody.retryAfterSeconds);
  }

  const code = parsedBody.code || (response.status === 429 ? 'RATE_LIMITED' : 'UNKNOWN_ERROR');
  let message = parsedBody.error || 'An unexpected error occurred.';

  switch (code) {
    case 'RATE_LIMITED':
      message = retryAfterSeconds
        ? `Too many requests. Please retry after ${retryAfterSeconds} seconds.`
        : 'Too many requests. Please try again in a few moments.';
      break;

    case 'UPLOAD_QUOTA_EXCEEDED':
      message = 'The upload quota for this resource has been exceeded. Please delete old files or contact support.';
      break;

    case 'NEW_LOGIN_LIMIT_REACHED':
      message = retryAfterSeconds
        ? `Too many new sign-ins. Please try again after ${retryAfterSeconds} seconds.`
        : 'Too many new sign-ins. Please try again in a few moments.';
      break;

    case 'AUTH_COOLDOWN_ACTIVE':
      message = retryAfterSeconds
        ? `Too many failed password attempts. Access is locked for another ${retryAfterSeconds} seconds.`
        : 'Too many failed password attempts. Cooldown active. Please try again later.';
      break;

    case 'AUTH_TEMPORARILY_LOCKED':
      message = retryAfterSeconds
        ? `This account has been temporarily locked due to excessive failed attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`
        : 'This account has been temporarily locked. Please try again later.';
      break;

    case 'SESSION_REVOKED':
    case 'REVOKED':
      message = 'Your session has been revoked. Please sign in again.';
      break;

    case 'SESSION_EXPIRED':
    case 'EXPIRED':
      message = 'Your session has expired due to inactivity. Please sign in again.';
      break;

    case 'FEATURE_UNAVAILABLE':
      message = 'This feature is currently unavailable on your current school subscription plan.';
      break;

    // Observed on POST /api/mobile/login when the school itself is
    // suspended/expired (unifiedMobileLogin returns this, not SCHOOL_SUSPENDED
    // / SCHOOL_EXPIRED — those two are defined here for forward-compat with
    // other backend surfaces but are not currently emitted on the mobile path).
    case 'SCHOOL_BLOCKED':
    case 'SCHOOL_SUSPENDED':
    case 'SUSPENDED':
      message = "This school's access is suspended. Please contact the administrator.";
      break;

    case 'SCHOOL_EXPIRED':
      message = "This school's subscription has expired. Please contact the administrator.";
      break;

    case 'INVALID_CREDENTIALS':
      message = parsedBody.error || 'Invalid credentials.';
      break;
  }

  return { message, code, retryAfterSeconds };
}
