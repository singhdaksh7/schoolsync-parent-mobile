import React from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { renderHook } from './test-utils/render-hook';

function mockResponse(status: number, body: unknown, ok = status < 400) {
  return {
    ok,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

const LOGIN_RESPONSE = {
  actorType: 'STUDENT',
  token: 'tok-1',
  student: { id: 's-1', name: 'Test Student', rollNo: '1', admissionNo: 'A1', email: null, schoolId: 'school-1', sectionId: 'sec-1' },
  school: { id: 'school-1', name: 'Royal Public school', slug: 'royal-public-school', logoUrl: null, primaryColor: null, secondaryColor: null, appName: null },
  branding: { logoUrl: null, primaryColor: null, secondaryColor: null, appName: null },
};

describe('loginParentOrStudent — schoolSlug in the /api/mobile/login payload', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('includes the configured schoolSlug in the request body', async () => {
    const calls: { path: string; body: unknown }[] = [];
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      if (path.endsWith('/api/mobile/login')) {
        calls.push({ path, body: JSON.parse(String(init?.body)) });
        return mockResponse(200, LOGIN_RESPONSE);
      }
      // Background /api/branding fetch on AuthProvider mount — irrelevant here.
      return mockResponse(200, {});
    }) as unknown as typeof fetch;

    const { result, act } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => React.createElement(AuthProvider, null, children),
    });

    await act(async () => {
      await result.loginParentOrStudent('A1', 'password123');
    });

    const loginCalls = calls.filter((c) => c.path.endsWith('/api/mobile/login'));
    expect(loginCalls).toHaveLength(1);
    expect(loginCalls[0].body).toMatchObject({ identifier: 'A1', password: 'password123', schoolSlug: 'test-school' });
  });

  it('reports a readable config error (not silence) when EXPO_PUBLIC_SCHOOL_SLUG is unset — auth-context throws this before any network call', () => {
    // api-client.ts reads EXPO_PUBLIC_SCHOOL_SLUG into a module-level const at
    // import time (same reasoning as jest.setup.js's EXPO_PUBLIC_API_URL
    // comment) — reset + re-require in isolation to observe the unset case
    // without a React re-instantiation (isolateModules would also re-require
    // react itself, breaking hooks in the render-hook tree above).
    let configError: string | null | undefined;
    jest.isolateModules(() => {
      process.env.EXPO_PUBLIC_SCHOOL_SLUG = '';
      configError = require('@/lib/api-client').SCHOOL_SLUG_CONFIG_ERROR;
    });

    expect(configError).toMatch(/School is not configured.*EXPO_PUBLIC_SCHOOL_SLUG/);

    process.env.EXPO_PUBLIC_SCHOOL_SLUG = 'test-school';
  });
});
