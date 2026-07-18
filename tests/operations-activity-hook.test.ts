import { renderHook } from './test-utils/render-hook';
import { clearAllCache } from '@/lib/query-cache';

jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'test-token', user: { schoolId: 'school-a' } }) }));

const mockApiRequest = jest.fn();
jest.mock('@/lib/api-client', () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));

import { useOperationsActivity } from '@/hooks/useOperationsActivity';

function page(items: number, hasNextPage: boolean) {
  return {
    data: Array.from({ length: items }, (_, i) => ({ id: `item-${i}`, code: 'HOMEWORK_CREATED', entityType: 'Homework', entityId: `h-${i}`, actorName: 'T', actorRole: 'TEACHER', createdAt: '2026-07-06T10:00:00Z', metadata: null })),
    pagination: { page: 1, limit: 20, total: 25, totalPages: 2, hasNextPage, hasPreviousPage: false },
  };
}

describe('useOperationsActivity — pagination', () => {
  beforeEach(() => {
    clearAllCache();
    mockApiRequest.mockReset();
  });

  it('loads page 1 on mount and exposes hasNextPage from the response', async () => {
    mockApiRequest.mockResolvedValueOnce(page(20, true));
    const hook = renderHook(() => useOperationsActivity());
    await hook.act(async () => {
      await Promise.resolve();
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/schools/school-a/operations/activity?page=1&limit=20', {}, 'test-token');
    expect(hook.result.items).toHaveLength(20);
    expect(hook.result.hasNextPage).toBe(true);
  });

  it('loadMore appends page 2 rather than replacing page 1', async () => {
    mockApiRequest.mockResolvedValueOnce(page(20, true)).mockResolvedValueOnce(page(5, false));

    const hook = renderHook(() => useOperationsActivity());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      hook.result.loadMore();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/schools/school-a/operations/activity?page=2&limit=20', {}, 'test-token');
    expect(hook.result.items).toHaveLength(25);
    expect(hook.result.hasNextPage).toBe(false);
  });

  it('handleRefresh resets to page 1, replacing accumulated items', async () => {
    mockApiRequest.mockResolvedValueOnce(page(20, true)).mockResolvedValueOnce(page(5, false)).mockResolvedValueOnce(page(20, true));

    const hook = renderHook(() => useOperationsActivity());
    await hook.act(async () => {
      await Promise.resolve();
    });
    await hook.act(async () => {
      hook.result.loadMore();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(hook.result.items).toHaveLength(25);

    await hook.act(async () => {
      hook.result.handleRefresh();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(hook.result.items).toHaveLength(20);
  });
});
