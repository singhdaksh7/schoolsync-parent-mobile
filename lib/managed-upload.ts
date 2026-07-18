// Shared managed-file-upload helper — the ONE place that builds a React
// Native FormData upload and posts it through apiRequest. Previously
// duplicated inline in useTeacherHomework.ts; Parent's homework-submission
// upload (Phase 6 gap closure) reuses this rather than a second copy.
import { apiRequest } from './api-client';

export type PickedFile = { uri: string; name: string; mimeType: string | null };

export type UploadedAttachment = { id: string; url: string; contentType: string };

/** Posts `file` as multipart/form-data to `path` and returns the managed file descriptor. */
export async function uploadManagedFile(token: string, path: string, file: PickedFile): Promise<UploadedAttachment> {
  const form = new FormData();
  // React Native's fetch/FormData polyfill accepts this {uri,name,type} shape
  // in place of a real Blob/File — this is the standard RN upload pattern.
  form.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' } as unknown as Blob);
  const result = await apiRequest<{ file: UploadedAttachment }>(path, { method: 'POST', body: form }, token);
  return result.file;
}
