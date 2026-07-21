import { renderHook } from './test-utils/render-hook';
import { clearAllCache } from '@/lib/query-cache';

jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'test-token' }) }));

const mockApiRequest = jest.fn();
jest.mock('@/lib/api-client', () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));

import { useTeacherReportCards } from '@/hooks/useTeacherReportCards';

const LIST_RESPONSE = { mentorSection: { id: 'sec-1', name: 'A', class: { id: 'c1', name: '8' } }, schemes: [{ id: 'scheme-1', name: 'Annual' }], reportCards: [] };

describe('useTeacherReportCards — sync vs queued-job tracking', () => {
  beforeEach(() => {
    clearAllCache();
    mockApiRequest.mockReset();
  });

  it('a sync response refreshes the list and never sets an active job', async () => {
    mockApiRequest
      .mockResolvedValueOnce(LIST_RESPONSE) // initial load
      .mockResolvedValueOnce({ success: true, count: 2, reportCards: [] }) // generate (sync)
      .mockResolvedValueOnce(LIST_RESPONSE); // reload after generate

    const hook = renderHook(() => useTeacherReportCards());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.generate('scheme-1');
    });

    expect(hook.result.activeJob).toBeNull();
  });

  it('a job-mode (202) response is tracked as an active job, never synthesizing a status on the tracked-job record itself', async () => {
    mockApiRequest
      .mockResolvedValueOnce(LIST_RESPONSE)
      .mockResolvedValueOnce({ mode: 'job', jobId: 'job-1', status: 'PENDING', totalItems: 40, deduplicated: false })
      .mockResolvedValue({ status: 'RUNNING', totalItems: 40, processedItems: 0 }); // any subsequent live poll

    const hook = renderHook(() => useTeacherReportCards());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.generate('scheme-1');
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(hook.result.activeJob).not.toBeNull();
    expect(hook.result.activeJob?.jobId).toBe('job-1');
    expect(hook.result.activeJob?.totalItems).toBe(40);
    expect(hook.result.activeJob?.deduplicated).toBe(false);
    // The tracked-job record itself never claims a status — real status comes
    // from the live poller's `jobStatus`, checked separately below.
    expect(hook.result.activeJob).not.toHaveProperty('status');
    hook.unmount();
  });

  it('a deduplicated existing job is tracked with deduplicated: true, not created as a new job', async () => {
    mockApiRequest
      .mockResolvedValueOnce(LIST_RESPONSE)
      .mockResolvedValueOnce({ mode: 'job', jobId: 'existing-job', status: 'RUNNING', totalItems: 40, deduplicated: true })
      .mockResolvedValue({ status: 'RUNNING', totalItems: 40, processedItems: 0 });

    const hook = renderHook(() => useTeacherReportCards());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.generate('scheme-1');
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(hook.result.activeJob?.jobId).toBe('existing-job');
    expect(hook.result.activeJob?.deduplicated).toBe(true);
    hook.unmount();
  });

  it('dismissActiveJob clears the tracked job locally without calling any route', async () => {
    mockApiRequest
      .mockResolvedValueOnce(LIST_RESPONSE)
      .mockResolvedValueOnce({ mode: 'job', jobId: 'job-1', status: 'PENDING', totalItems: 5, deduplicated: false })
      .mockResolvedValue({ status: 'RUNNING', totalItems: 5, processedItems: 0 });

    const hook = renderHook(() => useTeacherReportCards());
    await hook.act(async () => {
      await Promise.resolve();
    });
    await hook.act(async () => {
      await hook.result.generate('scheme-1');
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(hook.result.activeJob).not.toBeNull();

    const callsBeforeDismiss = mockApiRequest.mock.calls.length;
    hook.act(() => {
      hook.result.dismissActiveJob();
    });
    expect(hook.result.activeJob).toBeNull();
    expect(mockApiRequest.mock.calls.length).toBe(callsBeforeDismiss); // dismiss itself makes no network call
    hook.unmount();
  });
});

describe('useTeacherReportCards — live job polling via GET /api/teacher/jobs/:id (Gap A closure)', () => {
  beforeEach(() => {
    clearAllCache();
    mockApiRequest.mockReset();
  });

  it('begins polling the Teacher-scoped job-status route once a job-mode response is tracked', async () => {
    mockApiRequest
      .mockResolvedValueOnce(LIST_RESPONSE) // initial load
      .mockResolvedValueOnce({ mode: 'job', jobId: 'job-1', status: 'PENDING', totalItems: 40, deduplicated: false }) // generate
      .mockResolvedValueOnce({ status: 'RUNNING', totalItems: 40, processedItems: 12 }); // first poll

    const hook = renderHook(() => useTeacherReportCards());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.generate('scheme-1');
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/teacher/jobs/job-1', {}, 'test-token');
    expect(hook.result.jobStatus?.status).toBe('RUNNING');
    expect(hook.result.jobStatus?.processedItems).toBe(12);
    expect(hook.result.activeJob).not.toBeNull(); // still tracked — not terminal yet
    hook.unmount(); // stop the poller — a non-terminal job leaves a real 5s timer scheduled
  });

  it('clears the tracked job and reloads the list automatically once the poller reports COMPLETED', async () => {
    mockApiRequest
      .mockResolvedValueOnce(LIST_RESPONSE) // initial load
      .mockResolvedValueOnce({ mode: 'job', jobId: 'job-1', status: 'PENDING', totalItems: 40, deduplicated: false }) // generate
      .mockResolvedValueOnce({ status: 'COMPLETED', totalItems: 40, processedItems: 40 }) // poll -> terminal
      .mockResolvedValueOnce({ ...LIST_RESPONSE, reportCards: [{ id: 'rc-1' }] }); // auto reload

    const hook = renderHook(() => useTeacherReportCards());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.generate('scheme-1');
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(hook.result.activeJob).toBeNull();
    expect(hook.result.jobStatus?.status).toBe('COMPLETED');
    hook.unmount();
  });

  it('surfaces a FAILED terminal status as an error and stops tracking the job, without silently discarding it', async () => {
    mockApiRequest
      .mockResolvedValueOnce(LIST_RESPONSE)
      .mockResolvedValueOnce({ mode: 'job', jobId: 'job-1', status: 'PENDING', totalItems: 40, deduplicated: false })
      .mockResolvedValueOnce({ status: 'FAILED', totalItems: 40, processedItems: 10, errorSummary: '3 students missing marks' });

    const hook = renderHook(() => useTeacherReportCards());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.generate('scheme-1');
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(hook.result.activeJob).toBeNull();
    expect(hook.result.error).toBe('3 students missing marks');
    hook.unmount();
  });
});
