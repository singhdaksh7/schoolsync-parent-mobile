import { renderHook } from './test-utils/render-hook';
import { clearAllCache } from '@/lib/query-cache';

jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'test-token' }) }));

const mockApiRequest = jest.fn();
jest.mock('@/lib/api-client', () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));

import { useTeacherSubmissions } from '@/hooks/useTeacherSubmissions';

const SUBMISSIONS_RESPONSE = {
  homework: { id: 'hw-1', deadlineAt: '2020-01-01T00:00:00.000Z' },
  submissions: [
    { id: 'sub-1', studentId: 's1', submissionStatus: 'PENDING' },
    { id: 'sub-2', studentId: 's2', submissionStatus: 'PENDING' },
    { id: 'sub-3', studentId: 's3', submissionStatus: 'PENDING' },
  ],
};

describe('useTeacherSubmissions — batch scoring is ONE request regardless of row count', () => {
  beforeEach(() => {
    clearAllCache();
    mockApiRequest.mockReset();
  });

  it('saveBatchScores sends every entry in a single POST to the batch route', async () => {
    mockApiRequest
      .mockResolvedValueOnce(SUBMISSIONS_RESPONSE) // initial load
      .mockResolvedValueOnce({ success: true }) // batch save
      .mockResolvedValueOnce(SUBMISSIONS_RESPONSE); // reload

    const hook = renderHook(() => useTeacherSubmissions('hw-1'));
    await hook.act(async () => {
      await Promise.resolve();
    });

    const callsBefore = mockApiRequest.mock.calls.length;
    await hook.act(async () => {
      await hook.result.saveBatchScores([
        { studentId: 's1', status: 'NOT_SUBMITTED' },
        { studentId: 's2', status: 'NOT_SUBMITTED' },
        { studentId: 's3', status: 'NOT_SUBMITTED' },
      ]);
    });

    // Exactly two calls happened for this action: the batch POST + the
    // subsequent list reload — never one call per submission (3 rows here).
    const callsAfter = mockApiRequest.mock.calls.length;
    expect(callsAfter - callsBefore).toBe(2);

    const batchCall = mockApiRequest.mock.calls[callsBefore];
    expect(batchCall[0]).toBe('/api/teacher/homework/hw-1/scores');
    const body = JSON.parse((batchCall[1] as { body: string }).body);
    expect(body.scores).toHaveLength(3);
  });

  it('single scoreSubmission targets exactly one submission via the single-submission route', async () => {
    mockApiRequest
      .mockResolvedValueOnce(SUBMISSIONS_RESPONSE)
      .mockResolvedValueOnce({ id: 'sub-1' })
      .mockResolvedValueOnce(SUBMISSIONS_RESPONSE);

    const hook = renderHook(() => useTeacherSubmissions('hw-1'));
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.scoreSubmission('sub-1', { status: 'REVIEWED', score: 8, maxScore: 10 });
    });

    const scoreCall = mockApiRequest.mock.calls.find(([path]) => typeof path === 'string' && path.includes('/submissions/sub-1'));
    expect(scoreCall?.[0]).toBe('/api/teacher/homework/hw-1/submissions/sub-1');
  });
});
