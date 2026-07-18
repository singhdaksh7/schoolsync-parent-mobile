import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL, invalidatePrefix } from '@/lib/query-cache';
import { uploadManagedFile } from '@/lib/managed-upload';
import { sortStudentsByRollNumber } from '@/lib/student-ordering';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { TeacherAssignment, TeacherHomeworkItem, TeacherHomeworkListResponse } from '@/lib/types';
import type { PickedFile, UploadedAttachment } from '@/lib/managed-upload';

export type { PickedFile, UploadedAttachment };

const SCOPE = 'teacher-homework';

export type CreateHomeworkInput = {
  title: string;
  subject: string;
  sectionId: string;
  dueDate: string;
  description?: string;
};

export type EditHomeworkInput = Partial<{
  title: string;
  description: string | null;
  dueDate: string;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
}>;

/** GET/POST /api/teacher/homework (list/create), PATCH .../[id] (edit), and
 * POST .../[id]/attachment (managed upload) — all bearer-compatible since
 * the Teacher mobile bearer-compatibility closure. */
export function useTeacherHomework() {
  const { token } = useAuth();
  const [homework, setHomework] = useState<TeacherHomeworkItem[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE),
          CACHE_TTL.HOMEWORK,
          () => apiRequest<TeacherHomeworkListResponse>('/api/teacher/homework', {}, token),
          { force }
        );
        // Normalize at the fetch boundary — see useTeacherSchedule for why.
        setHomework(Array.isArray(result.homework) ? result.homework : []);
        setAssignments(
          Array.isArray(result.assignments)
            ? result.assignments.map((assignment) => ({ ...assignment, students: sortStudentsByRollNumber(assignment.students) }))
            : []
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load homework.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useForegroundRefresh(useCallback(() => load(), [load]));

  const createHomework = useCallback(
    async (input: CreateHomeworkInput): Promise<TeacherHomeworkItem | null> => {
      if (!token) return null;
      setError(null);
      setCreating(true);
      try {
        const created = await apiRequest<TeacherHomeworkItem>('/api/teacher/homework', { method: 'POST', body: JSON.stringify(input) }, token);
        invalidatePrefix(cacheKey(token, SCOPE));
        await load(true);
        return created;
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : 'Failed to create homework.');
        return null;
      } finally {
        setCreating(false);
      }
    },
    [token, load]
  );

  const editHomework = useCallback(
    async (homeworkId: string, input: EditHomeworkInput): Promise<TeacherHomeworkItem | null> => {
      if (!token) return null;
      setError(null);
      setEditing(true);
      try {
        const updated = await apiRequest<TeacherHomeworkItem>(
          `/api/teacher/homework/${homeworkId}`,
          { method: 'PATCH', body: JSON.stringify(input) },
          token
        );
        invalidatePrefix(cacheKey(token, SCOPE));
        await load(true);
        return updated;
      } catch (editError) {
        setError(editError instanceof Error ? editError.message : 'Failed to update homework.');
        return null;
      } finally {
        setEditing(false);
      }
    },
    [token, load]
  );

  /** Attachment upload happens AFTER homework creation, since the route
   * requires a real homeworkId — never before. A failure here does not mean
   * the homework wasn't created; callers should surface that distinction. */
  const uploadAttachment = useCallback(
    async (homeworkId: string, file: PickedFile): Promise<UploadedAttachment | null> => {
      if (!token) return null;
      setError(null);
      setUploading(true);
      try {
        const uploaded = await uploadManagedFile(token, `/api/teacher/homework/${homeworkId}/attachment`, file);
        invalidatePrefix(cacheKey(token, SCOPE));
        await load(true);
        return uploaded;
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload attachment.');
        return null;
      } finally {
        setUploading(false);
      }
    },
    [token, load]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return {
    homework,
    assignments,
    loading,
    refreshing,
    creating,
    editing,
    uploading,
    error,
    createHomework,
    editHomework,
    uploadAttachment,
    handleRefresh,
  };
}
