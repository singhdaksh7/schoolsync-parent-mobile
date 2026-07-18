import { ApiError, apiRequest, clearGetDedupCache, resetUnauthorizedGuard, setUnauthorizedHandler } from '@/lib/api-client';

function mockResponse(status: number, body: unknown, ok = status < 400) {
  return {
    ok,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

/** Simulates a response whose body fails to parse as JSON (empty/truncated
 * body) — the real physical-device condition behind the Android
 * TeacherHomeScreen `.filter()` crash: a 200 whose body isn't valid JSON.
 * Also covers the "redirected to the HTML /login page" case (Content-Type
 * text/html, body starting with `<!DOCTYPE html>`). */
function mockUnparseableResponse(status: number, ok = status < 400, rawText = 'not json') {
  return {
    ok,
    status,
    headers: { get: () => null },
    text: async () => rawText,
  } as unknown as Response;
}

describe('apiRequest — 401/403 behavior and GET de-duplication', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    setUnauthorizedHandler(null);
    clearGetDedupCache();
    resetUnauthorizedGuard();
  });

  it('triggers the global unauthorized handler exactly once for a burst of concurrent 401s', async () => {
    global.fetch = jest.fn(async () => mockResponse(401, { error: 'Unauthorized' }, false)) as unknown as typeof fetch;
    const handler = jest.fn();
    setUnauthorizedHandler(handler);

    const results = await Promise.allSettled([apiRequest('/api/a', {}, 'token'), apiRequest('/api/b', {}, 'token'), apiRequest('/api/c', {}, 'token')]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('resetUnauthorizedGuard (called after a fresh login/restore) lets the handler fire again', async () => {
    global.fetch = jest.fn(async () => mockResponse(401, {}, false)) as unknown as typeof fetch;
    const handler = jest.fn();
    setUnauthorizedHandler(handler);

    await apiRequest('/api/a', {}, 'token').catch(() => undefined);
    resetUnauthorizedGuard();
    await apiRequest('/api/b', {}, 'token').catch(() => undefined);

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not invoke the unauthorized handler on a 403 — permission denial never triggers global logout', async () => {
    global.fetch = jest.fn(async () => mockResponse(403, { error: 'Forbidden' }, false)) as unknown as typeof fetch;
    const handler = jest.fn();
    setUnauthorizedHandler(handler);

    await expect(apiRequest('/api/a', {}, 'token')).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });

  it('de-duplicates concurrent identical GET requests into one network call', async () => {
    let calls = 0;
    global.fetch = jest.fn(async () => {
      calls += 1;
      return mockResponse(200, { value: 'ok' });
    }) as unknown as typeof fetch;

    const [a, b] = await Promise.all([apiRequest('/api/same', {}, 'token'), apiRequest('/api/same', {}, 'token')]);
    expect(a).toEqual({ value: 'ok' });
    expect(b).toEqual({ value: 'ok' });
    expect(calls).toBe(1);
  });

  it('never de-duplicates mutations, even to an identical URL', async () => {
    let calls = 0;
    global.fetch = jest.fn(async () => {
      calls += 1;
      return mockResponse(200, { ok: true });
    }) as unknown as typeof fetch;

    await Promise.all([
      apiRequest('/api/same', { method: 'POST', body: '{}' }, 'token'),
      apiRequest('/api/same', { method: 'POST', body: '{}' }, 'token'),
    ]);
    expect(calls).toBe(2);
  });

  it('omits Content-Type for a FormData body, letting fetch set its own multipart boundary', async () => {
    let capturedHeaders: Record<string, string> | undefined;
    global.fetch = jest.fn(async (_url: unknown, init?: RequestInit) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return mockResponse(200, {});
    }) as unknown as typeof fetch;

    const form = new FormData();
    form.append('file', 'x');
    await apiRequest('/api/upload', { method: 'POST', body: form }, 'token');

    expect(capturedHeaders?.['Content-Type']).toBeUndefined();
  });

  it('sets Content-Type: application/json for a plain JSON body', async () => {
    let capturedHeaders: Record<string, string> | undefined;
    global.fetch = jest.fn(async (_url: unknown, init?: RequestInit) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return mockResponse(200, {});
    }) as unknown as typeof fetch;

    await apiRequest('/api/x', { method: 'POST', body: JSON.stringify({ a: 1 }) }, 'token');
    expect(capturedHeaders?.['Content-Type']).toBe('application/json');
  });

  it('throws MALFORMED_RESPONSE on a 200 with an unparseable body, instead of silently resolving to {} — the exact ' +
    'condition that caused the physical-device TeacherHomeScreen `.filter()` crash (an empty/truncated 200 body ' +
    'was being coerced into `{}`, so `result.slots` etc. came back undefined)', async () => {
    global.fetch = jest.fn(async () => mockUnparseableResponse(200)) as unknown as typeof fetch;

    await expect(apiRequest('/api/teacher/timetable', {}, 'token')).rejects.toBeInstanceOf(ApiError);
    await expect(apiRequest('/api/teacher/timetable', {}, 'token')).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  it('still resolves an unparseable ERROR-status body to a generic message, unaffected by the 200 fix', async () => {
    global.fetch = jest.fn(async () => mockUnparseableResponse(500, false)) as unknown as typeof fetch;

    await expect(apiRequest('/api/x', {}, 'token')).rejects.toBeInstanceOf(ApiError);
  });

  it('throws MALFORMED_RESPONSE on a 200 with an empty body', async () => {
    global.fetch = jest.fn(async () => mockUnparseableResponse(200, true, '')) as unknown as typeof fetch;

    await expect(apiRequest('/api/teacher/timetable', {}, 'token')).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  it('throws MALFORMED_RESPONSE on a 200 HTML login page (proxy redirect case) instead of crashing on JSON.parse', async () => {
    global.fetch = jest.fn(async () =>
      mockUnparseableResponse(200, true, '<!DOCTYPE html><html><head></head><body>Redirecting to /login...</body></html>')
    ) as unknown as typeof fetch;

    await expect(apiRequest('/api/teacher/timetable', {}, 'token')).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });

  it('reads the response body exactly once (text(), not text() then json())', async () => {
    let textCalls = 0;
    const response = {
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => {
        textCalls += 1;
        return JSON.stringify({ value: 'ok' });
      },
    } as unknown as Response;
    global.fetch = jest.fn(async () => response) as unknown as typeof fetch;

    await apiRequest('/api/x', {}, 'token');
    expect(textCalls).toBe(1);
  });
});
