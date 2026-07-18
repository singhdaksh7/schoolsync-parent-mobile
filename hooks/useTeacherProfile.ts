import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import { sortStudentsByRollNumber } from '@/lib/student-ordering';
import type { TeacherProfile } from '@/lib/types';

const SCOPE = 'teacher-profile';

/** GET /api/teacher/me — identity + mentor-section roster. Used as the
 * student-attendance roster source (the attendance routes themselves only
 * return existing Attendance rows, never the class list). */
export function useTeacherProfile() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(cacheKey(token, SCOPE), CACHE_TTL.PROFILE, () => apiRequest<TeacherProfile>('/api/teacher/me', {}, token), {
          force,
        });
        setProfile(
          result?.mentorSection?.students
            ? { ...result, mentorSection: { ...result.mentorSection, students: sortStudentsByRollNumber(result.mentorSection.students) } }
            : result
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load teacher profile.');
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { profile, loading, error, refresh: () => load(true) };
}
