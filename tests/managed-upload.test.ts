const mockApiRequest = jest.fn();
jest.mock('@/lib/api-client', () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));

import { uploadManagedFile } from '@/lib/managed-upload';

describe('uploadManagedFile — native FormData shape', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
  });

  it('appends the file as a native {uri,name,type} object under field "file", never a web Blob', async () => {
    mockApiRequest.mockResolvedValueOnce({ file: { id: 'file-1', url: 'https://signed.example/file-1', contentType: 'application/pdf' } });

    await uploadManagedFile('token', '/api/teacher/homework/hw-1/attachment', {
      uri: 'file:///cache/essay.pdf',
      name: 'essay.pdf',
      mimeType: 'application/pdf',
    });

    expect(mockApiRequest).toHaveBeenCalledTimes(1);
    const [path, options, token] = mockApiRequest.mock.calls[0];
    expect(path).toBe('/api/teacher/homework/hw-1/attachment');
    expect(token).toBe('token');
    expect(options.method).toBe('POST');

    const form = options.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    // React Native FormData stores parts internally; access via the polyfill's getParts/get.
    const parts = (form as unknown as { getParts?: () => Array<{ fieldName: string; string?: string; uri?: string }> }).getParts?.();
    if (parts) {
      const filePart = parts.find((p) => p.fieldName === 'file');
      expect(filePart?.uri).toBe('file:///cache/essay.pdf');
    }

    // The caller must never set Content-Type/boundary manually — that's left for
    // fetch/native runtime to compute from the FormData body.
    expect(options.headers).toBeUndefined();
  });

  it('falls back to application/octet-stream when the picked file has no MIME type', async () => {
    mockApiRequest.mockResolvedValueOnce({ file: { id: 'file-2', url: 'https://signed.example/file-2', contentType: 'application/octet-stream' } });

    await uploadManagedFile('token', '/api/parent/homework/hw-1/attachment', {
      uri: 'file:///cache/unknown',
      name: 'unknown',
      mimeType: null,
    });

    const [, options] = mockApiRequest.mock.calls[0];
    const form = options.body as FormData;
    const parts = (form as unknown as { getParts?: () => Array<{ fieldName: string; type?: string }> }).getParts?.();
    if (parts) {
      const filePart = parts.find((p) => p.fieldName === 'file');
      expect(filePart?.type).toBe('application/octet-stream');
    }
  });

  it('propagates upload errors (401/403/429/quota) without swallowing them', async () => {
    mockApiRequest.mockRejectedValueOnce(new Error('UPLOAD_QUOTA_EXCEEDED'));

    await expect(
      uploadManagedFile('token', '/api/teacher/homework/hw-1/attachment', { uri: 'file:///x.pdf', name: 'x.pdf', mimeType: 'application/pdf' })
    ).rejects.toThrow('UPLOAD_QUOTA_EXCEEDED');
  });
});
