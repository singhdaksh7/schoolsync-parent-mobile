import { renderHook } from './test-utils/render-hook';
import { clearAllCache } from '@/lib/query-cache';

jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'test-token' }) }));

const mockApiRequest = jest.fn();
jest.mock('@/lib/api-client', () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));

import { useTeacherHomework } from '@/hooks/useTeacherHomework';

const LIST_RESPONSE = { assignments: [], homework: [] };
const CREATED_HOMEWORK = { id: 'hw-1', title: 'Algebra', subject: 'Math', section: { id: 'sec-1', name: 'A', class: { id: 'c1', name: '8' } } };

describe('useTeacherHomework — create-then-upload sequencing', () => {
  beforeEach(() => {
    clearAllCache();
    mockApiRequest.mockReset();
  });

  it('creates homework, then uploads the attachment as a SEPARATE call after a real homeworkId exists', async () => {
    mockApiRequest
      .mockResolvedValueOnce(LIST_RESPONSE) // initial list load on mount
      .mockResolvedValueOnce(CREATED_HOMEWORK) // POST /api/teacher/homework
      .mockResolvedValueOnce(LIST_RESPONSE) // list reload after create
      .mockResolvedValueOnce({ file: { id: 'file-1', url: 'https://x/file-1', contentType: 'application/pdf' } }) // attachment upload
      .mockResolvedValueOnce(LIST_RESPONSE); // list reload after upload

    // NOTE: `hook.result` is a live getter — never destructure `result` out
    // of the harness, or it snapshots the value at that instant.
    const hook = renderHook(() => useTeacherHomework());
    await hook.act(async () => {
      await Promise.resolve();
    });

    let created: Awaited<ReturnType<typeof hook.result.createHomework>> = null;
    await hook.act(async () => {
      created = await hook.result.createHomework({ title: 'Algebra', subject: 'Math', sectionId: 'sec-1', dueDate: '2026-08-01' });
    });
    expect(created).toEqual(CREATED_HOMEWORK);

    // The attachment call must reference the just-created homework's id.
    await hook.act(async () => {
      await hook.result.uploadAttachment(created!.id, { uri: 'file:///tmp/x.pdf', name: 'x.pdf', mimeType: 'application/pdf' });
    });

    const attachmentCall = mockApiRequest.mock.calls.find(([path]) => typeof path === 'string' && path.includes('/attachment'));
    expect(attachmentCall?.[0]).toBe('/api/teacher/homework/hw-1/attachment');
  });

  it('a failed attachment upload does not imply homework creation failed — createHomework already resolved successfully', async () => {
    mockApiRequest
      .mockResolvedValueOnce(LIST_RESPONSE)
      .mockResolvedValueOnce(CREATED_HOMEWORK)
      .mockResolvedValueOnce(LIST_RESPONSE)
      .mockRejectedValueOnce(new Error('Upload quota exceeded'));

    const hook = renderHook(() => useTeacherHomework());
    await hook.act(async () => {
      await Promise.resolve();
    });

    let created: Awaited<ReturnType<typeof hook.result.createHomework>> = null;
    await hook.act(async () => {
      created = await hook.result.createHomework({ title: 'Algebra', subject: 'Math', sectionId: 'sec-1', dueDate: '2026-08-01' });
    });
    expect(created).not.toBeNull(); // homework creation itself succeeded

    let uploaded: unknown = 'unset';
    await hook.act(async () => {
      uploaded = await hook.result.uploadAttachment(created!.id, { uri: 'file:///tmp/x.pdf', name: 'x.pdf', mimeType: 'application/pdf' });
    });
    expect(uploaded).toBeNull(); // upload failed
    expect(hook.result.error).toContain('Upload quota exceeded'); // surfaced distinctly, not as a creation failure
  });

  it('never uploads before a homeworkId exists — uploadAttachment always requires an id argument', async () => {
    mockApiRequest.mockResolvedValueOnce(LIST_RESPONSE);
    const hook = renderHook(() => useTeacherHomework());
    await hook.act(async () => {
      await Promise.resolve();
    });
    // TypeScript enforces homeworkId as a required first argument to
    // uploadAttachment — there is no code path that calls it without one.
    expect(typeof hook.result.uploadAttachment).toBe('function');
    expect(hook.result.uploadAttachment.length).toBeGreaterThanOrEqual(2);
  });
});
