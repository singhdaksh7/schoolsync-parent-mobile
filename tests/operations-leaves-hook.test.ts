import { renderHook } from './test-utils/render-hook';
import { clearAllCache } from '@/lib/query-cache';

jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'test-token', user: { schoolId: 'school-a' } }) }));

const mockApiRequest = jest.fn();
jest.mock('@/lib/api-client', () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));

import { useOperationsLeaves } from '@/hooks/useOperationsLeaves';

const LIST_RESPONSE = {
  data: [{ id: 'leave-1', type: 'TEACHER', reason: 'Medical', fromDate: '2026-07-10', toDate: '2026-07-11', status: 'PENDING', teacherId: 'teacher-2', createdAt: '2026-07-06', teacher: { name: 'B', subject: null }, reviewedBy: null }],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
};

describe('useOperationsLeaves', () => {
  beforeEach(() => {
    clearAllCache();
    mockApiRequest.mockReset();
  });

  it('loads pending TEACHER-type leave requests scoped by query params', async () => {
    mockApiRequest.mockResolvedValueOnce(LIST_RESPONSE);
    const hook = renderHook(() => useOperationsLeaves());
    await hook.act(async () => {
      await Promise.resolve();
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/schools/school-a/leaves?type=TEACHER&status=PENDING', {}, 'test-token');
    expect(hook.result.data?.data).toHaveLength(1);
  });

  it('decide(APPROVED) PATCHes the leave and reloads the list', async () => {
    mockApiRequest.mockResolvedValueOnce(LIST_RESPONSE).mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ ...LIST_RESPONSE, data: [] });

    const hook = renderHook(() => useOperationsLeaves());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.decide('leave-1', 'APPROVED');
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/schools/school-a/leaves/leave-1',
      { method: 'PATCH', body: JSON.stringify({ status: 'APPROVED' }) },
      'test-token'
    );
    expect(hook.result.error).toBeNull();
  });

  it('a decide() failure surfaces a readable error without throwing', async () => {
    mockApiRequest.mockResolvedValueOnce(LIST_RESPONSE).mockRejectedValueOnce(new Error('Forbidden'));

    const hook = renderHook(() => useOperationsLeaves());
    await hook.act(async () => {
      await Promise.resolve();
    });

    let result: boolean | undefined;
    await hook.act(async () => {
      result = await hook.result.decide('leave-1', 'REJECTED');
    });

    expect(result).toBe(false);
    expect(hook.result.error).toBe('Forbidden');
  });
});
