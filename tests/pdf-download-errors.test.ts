jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/tmp/cache/',
  getInfoAsync: jest.fn(async () => ({ exists: true })),
  makeDirectoryAsync: jest.fn(async () => undefined),
  writeAsStringAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
  EncodingType: { Base64: 'base64' },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

import { downloadAuthenticatedPdf } from '@/lib/pdf-download';
import { ApiError, UnauthorizedError } from '@/lib/api-client';

function mockPdfResponse(status: number, ok: boolean, body: unknown = {}) {
  return {
    ok,
    status,
    headers: { get: () => null },
    json: async () => body,
    arrayBuffer: async () => new ArrayBuffer(4),
  } as unknown as Response;
}

describe('downloadAuthenticatedPdf — error mapping matches the shared API client', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws UnauthorizedError on a 401', async () => {
    global.fetch = jest.fn(async () => mockPdfResponse(401, false, { error: 'Unauthorized' })) as unknown as typeof fetch;
    await expect(downloadAuthenticatedPdf('/api/teacher/report-cards/card-1/pdf', 'token', 'card-1.pdf')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws ApiError with RATE_LIMITED on a 429', async () => {
    global.fetch = jest.fn(
      async () => mockPdfResponse(429, false, { error: 'Too many requests', code: 'RATE_LIMITED', retryAfterSeconds: 30 })
    ) as unknown as typeof fetch;

    try {
      await downloadAuthenticatedPdf('/api/teacher/report-cards/card-1/pdf', 'token', 'card-1.pdf');
      fail('expected downloadAuthenticatedPdf to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(429);
      expect((err as ApiError).code).toBe('RATE_LIMITED');
      expect((err as ApiError).retryAfterSeconds).toBe(30);
    }
  });

  it('throws a plain ApiError (not Unauthorized) on a 403 permission denial', async () => {
    global.fetch = jest.fn(async () => mockPdfResponse(403, false, { error: 'Forbidden' })) as unknown as typeof fetch;
    await expect(downloadAuthenticatedPdf('/api/teacher/report-cards/card-1/pdf', 'token', 'card-1.pdf')).rejects.toBeInstanceOf(ApiError);
    await expect(downloadAuthenticatedPdf('/api/teacher/report-cards/card-1/pdf', 'token', 'card-1.pdf')).rejects.not.toBeInstanceOf(UnauthorizedError);
  });

  it('returns a usable local uri and a cleanup function on success', async () => {
    global.fetch = jest.fn(async () => mockPdfResponse(200, true)) as unknown as typeof fetch;
    const result = await downloadAuthenticatedPdf('/api/teacher/report-cards/card-1/pdf', 'token', 'card-1.pdf');
    expect(result.uri).toContain('card-1.pdf');
    expect(typeof result.cleanup).toBe('function');
    await result.cleanup();
  });
});
