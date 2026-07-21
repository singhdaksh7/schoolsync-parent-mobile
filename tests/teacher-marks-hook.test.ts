import { renderHook } from './test-utils/render-hook';
import { clearAllCache } from '@/lib/query-cache';

jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'test-token' }) }));

const mockApiRequest = jest.fn();
jest.mock('@/lib/api-client', () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));

import { useTeacherMarks } from '@/hooks/useTeacherMarks';

const EXAMS_RESPONSE = {
  exams: [
    { id: 'exam-1', name: 'Midterm', maxMarks: 50, examSchemeId: 'scheme-1', examSchemeName: 'Annual' },
    { id: 'exam-2', name: 'Final', maxMarks: 100, examSchemeId: 'scheme-1', examSchemeName: 'Annual' },
  ],
};

describe('useTeacherMarks — exam picker (Gap B closure)', () => {
  beforeEach(() => {
    clearAllCache();
    mockApiRequest.mockReset();
  });

  it('loads the exam list from GET /api/teacher/exams on mount, unprompted', async () => {
    mockApiRequest.mockResolvedValueOnce(EXAMS_RESPONSE);

    const hook = renderHook(() => useTeacherMarks());
    await hook.act(async () => {
      await Promise.resolve();
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/teacher/exams', {}, 'test-token');
    expect(hook.result.exams).toEqual(EXAMS_RESPONSE.exams);
    expect(hook.result.examsLoading).toBe(false);
  });

  it('surfaces an exam-list load failure without throwing', async () => {
    mockApiRequest.mockRejectedValueOnce(new Error('Forbidden'));

    const hook = renderHook(() => useTeacherMarks());
    await hook.act(async () => {
      await Promise.resolve();
    });

    expect(hook.result.exams).toEqual([]);
    expect(hook.result.examsError).toBe('Forbidden');
  });

  it('load()/save() still use the explicit examId selected from the picker — no inference', async () => {
    mockApiRequest
      .mockResolvedValueOnce(EXAMS_RESPONSE) // exams
      .mockResolvedValueOnce([{ studentId: 'stu-1', marks: 40 }]); // results for exam-1/sec-1

    const hook = renderHook(() => useTeacherMarks());
    await hook.act(async () => {
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.load('exam-1', 'sec-1');
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/teacher/results?examId=exam-1&sectionId=sec-1', {}, 'test-token');
    expect(hook.result.context).toEqual({ examId: 'exam-1', sectionId: 'sec-1' });
    expect(hook.result.results).toEqual([{ studentId: 'stu-1', marks: 40 }]);
  });
});
