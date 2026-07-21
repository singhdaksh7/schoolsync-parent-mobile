// Pure routing-decision helpers, factored out of app/index.tsx so they're
// unit-testable without rendering expo-router navigation.
import { isAdminRole } from './format';

export type LandingRoute = '/login' | '/mobile-unavailable' | '/parent' | '/teacher' | '/student' | '/admin' | '/driver';

/**
 * Decides where the root gate sends an authenticated (or not-yet-authenticated)
 * user. MOBILE_APP being disabled overrides actor routing entirely — but only
 * once the feature bootstrap has actually resolved (`mobileAppEnabled: null`
 * means "not loaded yet", which must NOT be treated as disabled).
 */
export function resolveLandingRoute(input: {
  token: string | null;
  role: string;
  mobileAppEnabled: boolean | null;
}): LandingRoute {
  if (!input.token) return '/login';
  if (input.mobileAppEnabled === false) return '/mobile-unavailable';
  if (input.role === 'TEACHER') return '/teacher';
  if (input.role === 'STUDENT') return '/student';
  if (input.role === 'DRIVER') return '/driver';
  if (isAdminRole(input.role)) return '/admin';
  return '/parent';
}
