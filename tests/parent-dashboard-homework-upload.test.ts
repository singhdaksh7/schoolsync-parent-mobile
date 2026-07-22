import { renderHook } from './test-utils/render-hook';
import { clearAllCache } from '@/lib/query-cache';

jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'test-token' }) }));

const mockApiRequest = jest.fn();
jest.mock('@/lib/api-client', () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));

import { useParentDashboard } from '@/hooks/useParentDashboard';
import { ParentSelectionProvider } from '@/lib/parent-selection-context';
import type { HomeworkItem } from '@/lib/types';

const CHILD = { id: 'stu-1', name: 'Aarav', rollNo: '12' };
const HOMEWORK_ITEM: HomeworkItem = {
  id: 'hwstatus-1',
  homeworkId: 'hw-1',
  studentId: 'stu-1',
  title: 'Essay',
  subject: 'English',
  dueDate: '2026-07-10',
  deadlineAt: '2026-07-10T23:59:00Z',
  homeworkStatus: 'ACTIVE',
  submissionStatus: 'PENDING',
  submissionMethod: 'NONE',
  checkedAt: null,
  submittedAt: null,
  score: null,
  maxScore: null,
  teacherRemark: null,
};

function emptyStudentData() {
  return { attendance: [], marks: [], reportCards: [], timetable: [], homework: [HOMEWORK_ITEM] };
}

function mockInitialLoad() {
  mockApiRequest
    .mockResolvedValueOnce({ children: [CHILD] }) // /api/parent/children
    .mockResolvedValueOnce({ announcements: [] }) // /api/parent/announcements
    .mockResolvedValueOnce({ pendingFees: [] }) // /api/parent/fees
    .mockResolvedValueOnce({ attendance: [] }) // student attendance
    .mockResolvedValueOnce({ marks: [] })
    .mockResolvedValueOnce({ reportCards: [] })
    .mockResolvedValueOnce({ timetable: [] })
    .mockResolvedValueOnce({ homework: [HOMEWORK_ITEM] });
}

describe('useParentDashboard — managed homework-submission upload (Parent Mobile gap closure)', () => {
  beforeEach(() => {
    clearAllCache();
    mockApiRequest.mockReset();
  });

  it('uploads the picked file to .../attachment first, then submits with attachmentFileId — never a raw URL', async () => {
    mockInitialLoad();
    mockApiRequest
      .mockResolvedValueOnce({ file: { id: 'file-1', url: 'https://signed.example/file-1', contentType: 'application/pdf' } }) // attachment upload
      .mockResolvedValueOnce({ submission: { id: 'sub-1' } }) // submit
      .mockResolvedValueOnce(emptyStudentData().homework && { homework: [HOMEWORK_ITEM] }) // reload homework (invalidated prefix)
      .mockResolvedValueOnce({ attendance: [] })
      .mockResolvedValueOnce({ marks: [] })
      .mockResolvedValueOnce({ reportCards: [] })
      .mockResolvedValueOnce({ timetable: [] })
      .mockResolvedValueOnce({ homework: [HOMEWORK_ITEM] });

    const hook = renderHook(() => useParentDashboard(), { wrapper: ParentSelectionProvider });
    await hook.act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await hook.act(async () => {
      await hook.result.handleSubmitHomework(HOMEWORK_ITEM, { uri: 'file:///essay.pdf', name: 'essay.pdf', mimeType: 'application/pdf' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/parent/homework/hw-1/attachment?studentId=stu-1',
      expect.objectContaining({ method: 'POST' }),
      'test-token'
    );
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/parent/homework/hw-1/submit',
      { method: 'POST', body: JSON.stringify({ studentId: 'stu-1', attachmentFileId: 'file-1' }) },
      'test-token'
    );
    expect(hook.result.error).toBeNull();
  });

  it('an upload failure surfaces a readable error and never calls submit', async () => {
    mockInitialLoad();
    mockApiRequest.mockRejectedValueOnce(new Error('Upload quota exceeded'));

    const hook = renderHook(() => useParentDashboard(), { wrapper: ParentSelectionProvider });
    await hook.act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const callsBeforeSubmit = mockApiRequest.mock.calls.length;
    await hook.act(async () => {
      await hook.result.handleSubmitHomework(HOMEWORK_ITEM, { uri: 'file:///essay.pdf', name: 'essay.pdf', mimeType: 'application/pdf' });
    });

    expect(hook.result.error).toBe('Upload quota exceeded');
    // Exactly one more call happened (the failed attachment upload) — submit was never reached.
    expect(mockApiRequest.mock.calls.length).toBe(callsBeforeSubmit + 1);
  });
});
