import { renderHook } from './test-utils/render-hook';
import { clearAllCache } from '@/lib/query-cache';

jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'test-token' }) }));

const mockApiRequest = jest.fn();
jest.mock('@/lib/api-client', () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));

import { useParentStudentLeave } from '@/hooks/useParentStudentLeave';

const LEAVES_RESPONSE = {
  leaves: [{ id: 'leave-1', reason: 'Sick: Fever', fromDate: '2026-07-10', toDate: '2026-07-11', status: 'PENDING', reviewedBy: null }],
};

describe('useParentStudentLeave', () => {
  beforeEach(() => {
    clearAllCache();
    mockApiRequest.mockReset();
  });

  it('loads the selected child leave history scoped by studentId', async () => {
    mockApiRequest.mockResolvedValueOnce(LEAVES_RESPONSE);
    const hook = renderHook(() => useParentStudentLeave('student-1'));
    await hook.act(async () => {
      await Promise.resolve();
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/parent/leave?studentId=student-1', {}, 'test-token');
    expect(hook.result.leaves).toHaveLength(1);
  });

  it('does not call the API and returns no leaves when no child is selected', async () => {
    const hook = renderHook(() => useParentStudentLeave(null));
    await hook.act(async () => {
      await Promise.resolve();
    });

    expect(mockApiRequest).not.toHaveBeenCalled();
    expect(hook.result.leaves).toEqual([]);
  });

  it('keeps leave lists isolated per child (cache keyed by studentId)', async () => {
    mockApiRequest.mockResolvedValueOnce(LEAVES_RESPONSE);
    const other = { leaves: [{ id: 'leave-2', reason: 'Family: Trip', fromDate: '2026-07-20', toDate: '2026-07-22', status: 'APPROVED', reviewedBy: { name: 'Admin' } }] };
    mockApiRequest.mockResolvedValueOnce(other);

    const hookForChildA = renderHook(() => useParentStudentLeave('child-a'));
    await hookForChildA.act(async () => {
      await Promise.resolve();
    });
    expect(mockApiRequest).toHaveBeenCalledWith('/api/parent/leave?studentId=child-a', {}, 'test-token');

    const hookForChildB = renderHook(() => useParentStudentLeave('child-b'));
    await hookForChildB.act(async () => {
      await Promise.resolve();
    });
    expect(mockApiRequest).toHaveBeenCalledWith('/api/parent/leave?studentId=child-b', {}, 'test-token');
    expect(hookForChildA.result.leaves[0].id).toBe('leave-1');
    expect(hookForChildB.result.leaves[0].id).toBe('leave-2');
  });

  it('createLeave POSTs studentId plus leaveType/reason/fromDate/toDate and reloads', async () => {
    mockApiRequest
      .mockResolvedValueOnce(LEAVES_RESPONSE)
      .mockResolvedValueOnce({ id: 'leave-2' })
      .mockResolvedValueOnce({ leaves: [{ id: 'leave-2', reason: 'Family: Trip', fromDate: '2026-07-20', toDate: '2026-07-22', status: 'PENDING', reviewedBy: null }] });

    const hook = renderHook(() => useParentStudentLeave('student-1'));
    await hook.act(async () => {
      await Promise.resolve();
    });

    let ok: boolean | undefined;
    await hook.act(async () => {
      ok = await hook.result.createLeave({ leaveType: 'Family', reason: 'Trip', fromDate: '2026-07-20', toDate: '2026-07-22' });
    });

    expect(ok).toBe(true);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/parent/leave',
      { method: 'POST', body: JSON.stringify({ studentId: 'student-1', leaveType: 'Family', reason: 'Trip', fromDate: '2026-07-20', toDate: '2026-07-22' }) },
      'test-token'
    );
  });

  it('createLeave is a no-op when no child is selected', async () => {
    const hook = renderHook(() => useParentStudentLeave(null));
    await hook.act(async () => {
      await Promise.resolve();
    });

    let ok: boolean | undefined;
    await hook.act(async () => {
      ok = await hook.result.createLeave({ leaveType: 'Family', reason: 'Trip', fromDate: '2026-07-20', toDate: '2026-07-22' });
    });

    expect(ok).toBe(false);
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it('a creation failure surfaces a readable error without throwing', async () => {
    mockApiRequest.mockResolvedValueOnce(LEAVES_RESPONSE).mockRejectedValueOnce(new Error('A leave request already exists for this date range.'));

    const hook = renderHook(() => useParentStudentLeave('student-1'));
    await hook.act(async () => {
      await Promise.resolve();
    });

    let ok: boolean | undefined;
    await hook.act(async () => {
      ok = await hook.result.createLeave({ leaveType: 'Sick', reason: 'Fever', fromDate: '2026-07-06', toDate: '2026-07-06' });
    });

    expect(ok).toBe(false);
    expect(hook.result.error).toBe('A leave request already exists for this date range.');
  });
});
