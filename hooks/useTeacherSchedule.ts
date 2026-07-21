import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { TeacherAssignment, TeacherTimetableSlot } from '@/lib/types';

const SCOPE = 'teacher-schedule';

/** GET /api/teacher/timetable — the live teacher timetable/schedule source
 * (not the admin Smart Timetable draft APIs). No feature flag or Cost Guard
 * category currently gates this route. */
export function useTeacherSchedule() {
  const { token } = useAuth();
  const [slots, setSlots] = useState<TeacherTimetableSlot[]>([]);
  const [teachingSections, setTeachingSections] = useState<TeacherAssignment[]>([]);
  const [periodsPerDay, setPeriodsPerDay] = useState(6);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE),
          CACHE_TTL.TIMETABLE,
          () =>
            apiRequest<{ teachingSections: TeacherAssignment[]; slots: TeacherTimetableSlot[]; periodsPerDay: number }>(
              '/api/teacher/timetable',
              {},
              token
            ),
          { force }
        );
        // Normalize at the fetch boundary: an unexpected response shape must
        // never hand the render layer `undefined` in place of an array.
        setSlots(Array.isArray(result.slots) ? result.slots : []);
        setTeachingSections(Array.isArray(result.teachingSections) ? result.teachingSections : []);
        setPeriodsPerDay(typeof result.periodsPerDay === 'number' ? result.periodsPerDay : 6);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load schedule.');
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

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return { slots, teachingSections, periodsPerDay, loading, refreshing, error, handleRefresh };
}
