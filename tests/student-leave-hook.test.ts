import { renderHook } from './test-utils/render-hook';
import { clearAllCache } from '@/lib/query-cache';

jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'test-token' }) }));

const mockApiRequest = jest.fn();
jest.mock('@/lib/api-client', () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));

import { useStudentLeave } from '@/hooks/useStudentLeave';

const LEAVES_RESPONSE = {
  leaves: [{ id: 'leave-1', reason: 'Sick: Fever', fromDate: '2026-07-10', toDate: '2026-07-11', status: 'PENDING', reviewedBy: null }],
};

describe('useStudentLeave', () => {
  beforeEach(() => {
    clearAllCache();
    mockApiRequest.mockReset();
  });

  it('loads the student own leave history via GET on mount', async () => {
    mockApiRequest.mockResolvedValueOnce(LEAVES_RESPONSE);
    const hook = renderHook(() => useStudentLeave());
    await hook.act(async () => {
      await Promise.resolve();
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/student/leave', {}, 'test-token');
    expect(hook.result.leaves).toHaveLength(1);
  });

  it('createLeave POSTs the full leaveType/reason/fromDate/toDate payload and reloads', async () => {
    mockApiRequest.mockResolvedValueOnce(LEAVES_RESPONSE).mockResolvedValueOnce({ id: 'leave-2' }).mockResolvedValueOnce({ leaves: [{ id: 'leave-2', reason: 'Family: Trip', fromDate: '2026-07-20', toDate: '2026-07-22', status: 'PENDING', reviewedBy: null }] });

    const hook = renderHook(() => useStudentLeave());
    await hook.act(async () => {
      await Promise.resolve();
    });

    let ok: boolean | undefined;
    await hook.act(async () => {
      ok = await hook.result.createLeave({ leaveType: 'Family', reason: 'Trip', fromDate: '2026-07-20', toDate: '2026-07-22' });
    });

    expect(ok).toBe(true);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/student/leave',
      { method: 'POST', body: JSON.stringify({ leaveType: 'Family', reason: 'Trip', fromDate: '2026-07-20', toDate: '2026-07-22' }) },
      'test-token'
    );
  });

  it('a creation failure (e.g. same-day cutoff) surfaces a readable error without throwing', async () => {
    mockApiRequest.mockResolvedValueOnce(LEAVES_RESPONSE).mockRejectedValueOnce(new Error('Same-day leave can only be requested before 7:30 AM.'));

    const hook = renderHook(() => useStudentLeave());
    await hook.act(async () => {
      await Promise.resolve();
    });

    let ok: boolean | undefined;
    await hook.act(async () => {
      ok = await hook.result.createLeave({ leaveType: 'Sick', reason: 'Fever', fromDate: '2026-07-06', toDate: '2026-07-06' });
    });

    expect(ok).toBe(false);
    expect(hook.result.error).toBe('Same-day leave can only be requested before 7:30 AM.');
  });
});
