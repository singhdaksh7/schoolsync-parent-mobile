import { parseCostGuardError } from '@/lib/cost-guard-error';

function response(status: number, retryAfterHeader?: string) {
  return {
    status,
    headers: { get: (name: string) => (name === 'Retry-After' ? (retryAfterHeader ?? null) : null) },
  } as unknown as Response;
}

describe('parseCostGuardError — shared mobile Cost Guard / auth error parser', () => {
  it('maps RATE_LIMITED with a Retry-After header', () => {
    const result = parseCostGuardError(response(429, '30'), { error: 'Too many requests', code: 'RATE_LIMITED' });
    expect(result.code).toBe('RATE_LIMITED');
    expect(result.retryAfterSeconds).toBe(30);
    expect(result.message).toContain('30 seconds');
  });

  it('prefers a body retryAfterSeconds over the header when both are present', () => {
    const result = parseCostGuardError(response(429, '30'), { code: 'RATE_LIMITED', retryAfterSeconds: 90 });
    expect(result.retryAfterSeconds).toBe(90);
  });

  it('maps AUTH_TEMPORARILY_LOCKED to a minutes-based message', () => {
    const result = parseCostGuardError(response(429), { code: 'AUTH_TEMPORARILY_LOCKED', retryAfterSeconds: 3600 });
    expect(result.message).toContain('60 minutes');
  });

  it('maps SESSION_REVOKED and REVOKED to the same message', () => {
    expect(parseCostGuardError(response(401), { code: 'SESSION_REVOKED' }).message).toMatch(/revoked/i);
    expect(parseCostGuardError(response(401), { code: 'REVOKED' }).message).toMatch(/revoked/i);
  });

  it('maps SESSION_EXPIRED and EXPIRED to the same message', () => {
    expect(parseCostGuardError(response(401), { code: 'SESSION_EXPIRED' }).message).toMatch(/expired/i);
    expect(parseCostGuardError(response(401), { code: 'EXPIRED' }).message).toMatch(/expired/i);
  });

  it('maps UPLOAD_QUOTA_EXCEEDED', () => {
    expect(parseCostGuardError(response(429), { code: 'UPLOAD_QUOTA_EXCEEDED' }).message).toMatch(/quota/i);
  });

  it('falls back to a generic UNKNOWN_ERROR code with the server message when no code is present', () => {
    const result = parseCostGuardError(response(400), { error: 'Bad input' });
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('Bad input');
  });

  it('infers RATE_LIMITED from a bare 429 with no code field', () => {
    const result = parseCostGuardError(response(429), {});
    expect(result.code).toBe('RATE_LIMITED');
  });

  it('never invents a retryAfterSeconds value when none is present', () => {
    const result = parseCostGuardError(response(403), { error: 'Forbidden', code: 'MISSING_PERMISSION' });
    expect(result.retryAfterSeconds).toBeNull();
  });
});
