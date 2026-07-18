import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cacheKey, cachedFetch, CACHE_TTL } from '@/lib/query-cache';
import { useForegroundRefresh } from './useForegroundRefresh';
import type { FeatureFlagKey, FeaturesResponse } from '@/lib/types';

const SCOPE = 'features';

/**
 * GET /api/mobile/features — school feature/channel entitlements for the
 * authenticated actor's own school. This is NOT actor authorization: a
 * `true` value means the module is enabled for the school, nothing more.
 * Teacher permissions (useTeacherPermissions) and Parent/Student actor rules
 * remain separately authoritative, and the backend's own 403 on the actual
 * request is still the final word — this hook only lets the UI proactively
 * hide navigation for a module that's off, saving a round trip to find out.
 */
export function useFeatureBootstrap() {
  const { token } = useAuth();
  const [features, setFeatures] = useState<Record<FeatureFlagKey, boolean> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await cachedFetch(
          cacheKey(token, SCOPE),
          CACHE_TTL.FEATURE_ENTITLEMENTS,
          () => apiRequest<FeaturesResponse>('/api/mobile/features', {}, token),
          { force }
        );
        setFeatures(result.features);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load feature availability.');
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

  useForegroundRefresh(useCallback(() => load(), [load]));

  // Fails OPEN only while the bootstrap hasn't resolved yet (first render
  // after login/restore) so navigation doesn't flicker hidden-then-shown;
  // once `features` is loaded, every key reads its real value. The backend
  // 403 on the actual request is the authoritative denial either way.
  const hasFeature = useCallback((key: FeatureFlagKey) => (features ? features[key] : true), [features]);

  return { features, loading, error, hasFeature, refresh: () => load(true) };
}
