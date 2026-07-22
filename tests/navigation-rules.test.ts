import { resolveLandingRoute } from '@/lib/navigation-rules';

describe('resolveLandingRoute — root redirect gate decision logic', () => {
  it('sends an unauthenticated user to login', () => {
    expect(resolveLandingRoute({ token: null, role: 'PARENT', mobileAppEnabled: true })).toBe('/login');
  });

  it('sends every actor to /mobile-unavailable when MOBILE_APP resolves to false', () => {
    expect(resolveLandingRoute({ token: 't', role: 'PARENT', mobileAppEnabled: false })).toBe('/mobile-unavailable');
    expect(resolveLandingRoute({ token: 't', role: 'TEACHER', mobileAppEnabled: false })).toBe('/mobile-unavailable');
    expect(resolveLandingRoute({ token: 't', role: 'STUDENT', mobileAppEnabled: false })).toBe('/mobile-unavailable');
  });

  it('does NOT gate on MOBILE_APP while the bootstrap has not resolved yet (null, not false)', () => {
    expect(resolveLandingRoute({ token: 't', role: 'TEACHER', mobileAppEnabled: null })).toBe('/teacher');
  });

  it('routes Parent/Student/Teacher/Admin actors correctly once MOBILE_APP is enabled', () => {
    expect(resolveLandingRoute({ token: 't', role: 'PARENT', mobileAppEnabled: true })).toBe('/parent');
    expect(resolveLandingRoute({ token: 't', role: 'STUDENT', mobileAppEnabled: true })).toBe('/student');
    expect(resolveLandingRoute({ token: 't', role: 'TEACHER', mobileAppEnabled: true })).toBe('/teacher');
    expect(resolveLandingRoute({ token: 't', role: 'SCHOOL_OWNER', mobileAppEnabled: true })).toBe('/admin');
    expect(resolveLandingRoute({ token: 't', role: 'SCHOOL_ADMIN', mobileAppEnabled: true })).toBe('/admin');
    expect(resolveLandingRoute({ token: 't', role: 'VICE_PRINCIPAL', mobileAppEnabled: true })).toBe('/admin');
  });

  it('routes DRIVER actors to /driver once MOBILE_APP is enabled', () => {
    expect(resolveLandingRoute({ token: 't', role: 'DRIVER', mobileAppEnabled: true })).toBe('/driver');
  });

  it('sends a DRIVER actor to /mobile-unavailable when MOBILE_APP resolves to false', () => {
    expect(resolveLandingRoute({ token: 't', role: 'DRIVER', mobileAppEnabled: false })).toBe('/mobile-unavailable');
  });

  it('defaults an unrecognized role to the Parent route (matches normalizeRole\'s PARENT fallback)', () => {
    expect(resolveLandingRoute({ token: 't', role: 'GUARDIAN', mobileAppEnabled: true })).toBe('/parent');
  });
});
