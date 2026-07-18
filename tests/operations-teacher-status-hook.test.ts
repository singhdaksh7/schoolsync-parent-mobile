import { renderHook } from './test-utils/render-hook';
import { clearAllCache } from '@/lib/query-cache';

jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'test-token', user: { schoolId: 'school-a' } }) }));

const mockApiRequest = jest.fn();
jest.mock('@/lib/api-client', () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));

import { useOperationsTeacherStatus } from '@/hooks/useOperationsTeacherStatus';

const STATUS_RESPONSE = {
  summary: { totalActiveTeachers: 2, present: 1, absent: 0, onLeave: 0, notMarked: 1, currentlyInClass: 1, currentlyFree: 0 },
  data: [
    { teacherId: 'teacher-1', teacherName: 'A', baseStatus: 'PRESENT', operationalStatus: 'IN_CLASS', todayScheduledPeriods: 3, todayCoveredPeriods: 1, todayFreePeriods: 0, currentAssignment: null, nextAssignment: null, onApprovedLeave: false, substitutingToday: [], warnings: [] },
    { teacherId: 'teacher-2', teacherName: 'B', baseStatus: 'NOT_MARKED', operationalStatus: 'NOT_MARKED', todayScheduledPeriods: 2, todayCoveredPeriods: 0, todayFreePeriods: 2, currentAssignment: null, nextAssignment: null, onApprovedLeave: false, substitutingToday: [], warnings: [] },
  ],
  pagination: { page: 1, limit: 100, total: 2, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
};

describe('useOperationsTeacherStatus', () => {
  beforeEach(() => {
    clearAllCache();
    mockApiRequest.mockReset();
  });

  it('loads the teacher status board via GET on mount', async () => {
    mockApiRequest.mockResolvedValueOnce(STATUS_RESPONSE);
    const hook = renderHook(() => useOperationsTeacherStatus());
    await hook.act(async () => {
      await Promise.resolve();
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/schools/school-a/operations/teachers/status?limit=100', {}, 'test-token');
    expect(hook.result.data?.summary.present).toBe(1);
    expect(hook.result.data?.data).toHaveLength(2);
  });

  it('setStatus PATCHes a single-teacher update and reloads on success', async () => {
    mockApiRequest
      .mockResolvedValueOnce(STATUS_RESPONSE)
      .mockResolvedValueOnce({ results: [{ teacherId: 'teacher-2', ok: true }] })
      .mockResolvedValueOnce(STATUS_RESPONSE);

    const hook = renderHook(() => useOperationsTeacherStatus());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.setStatus('teacher-2', 'PRESENT');
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/schools/school-a/operations/teachers/status',
      { method: 'PATCH', body: JSON.stringify({ updates: [{ teacherId: 'teacher-2', status: 'PRESENT' }] }) },
      'test-token'
    );
    expect(hook.result.error).toBeNull();
  });

  it('surfaces SELF_TEACHER_STATUS_MUTATION_FORBIDDEN as a readable error without a client-side crash', async () => {
    mockApiRequest
      .mockResolvedValueOnce(STATUS_RESPONSE)
      .mockResolvedValueOnce({ results: [{ teacherId: 'teacher-1', ok: false, reason: 'SELF_TEACHER_STATUS_MUTATION_FORBIDDEN' }] });

    const hook = renderHook(() => useOperationsTeacherStatus());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.setStatus('teacher-1', 'ABSENT');
    });

    expect(hook.result.error).toBe('You cannot change your own status this way.');
  });

  it('surfaces ON_APPROVED_LEAVE as a readable error', async () => {
    mockApiRequest
      .mockResolvedValueOnce(STATUS_RESPONSE)
      .mockResolvedValueOnce({ results: [{ teacherId: 'teacher-2', ok: false, reason: 'ON_APPROVED_LEAVE' }] });

    const hook = renderHook(() => useOperationsTeacherStatus());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.setStatus('teacher-2', 'ABSENT');
    });

    expect(hook.result.error).toBe('This teacher is on approved leave today.');
  });
});
