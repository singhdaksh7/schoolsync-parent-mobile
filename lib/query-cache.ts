// Lightweight TTL cache + in-flight de-duplication foundation for the mobile
// app. No query library (react-query/SWR/etc.) was already installed in
// package.json, so per Phase 6 guidance this establishes one maintainable
// cache layer instead of adding a second fetching framework.
//
// Scoping: every key MUST be namespaced by session (see cacheKey below) so
// nothing survives a logout or leaks across actors. clearAllCache() is called
// from lib/auth-context.tsx on logout/invalidation — since this app only ever
// holds one authenticated session at a time, wiping the whole cache on logout
// is both simplest and sufficient for actor isolation.

/** TTL guidance from the Phase 6 shared-foundation spec, in milliseconds. */
export const CACHE_TTL = {
  BRANDING: 24 * 60 * 60 * 1000,
  FEATURE_ENTITLEMENTS: 15 * 60 * 1000,
  TEACHER_PERMISSIONS: 10 * 60 * 1000,
  TEACHER_OPERATIONS_SELF_STATUS: 30 * 1000,
  TIMETABLE: 10 * 60 * 1000,
  ANNOUNCEMENTS: 5 * 60 * 1000,
  HOMEWORK: 2 * 60 * 1000,
  ATTENDANCE: 5 * 60 * 1000,
  FEES: 5 * 60 * 1000,
  REPORT_CARDS: 10 * 60 * 1000,
  PROFILE: 30 * 60 * 1000,
  // Teacher Operations Command Center metrics — no mobile screen consumes
  // these yet (see Phase 6 report, Mobile Integration Blockers). Defined now
  // so the eventual Operations screens don't need a second cache pass.
  OPERATIONS_TODAY: 45 * 1000,
  TEACHER_STATUS: 30 * 1000,
  ATTENDANCE_COMPLETION: 60 * 1000,
  LECTURE_COVERAGE: 30 * 1000,
  CURRENT_PERIOD: 30 * 1000,
  NEXT_PERIOD_RISK: 30 * 1000,
  TEACHER_WORKLOAD: 60 * 1000,
  NEEDS_ATTENTION: 30 * 1000,
  ACTIVITY: 30 * 1000,
  DAILY_SUMMARY: 60 * 1000,
} as const;

type CacheEntry = { data: unknown; expiresAt: number };

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

/** Builds a stable, session/actor-scoped cache key. Pass the session token
 * (or null when unauthenticated) as the first segment so keys can never
 * collide across a logout → different-account login cycle. */
export function cacheKey(scope: string | null, ...parts: (string | number | null | undefined)[]): string {
  return [scope ?? 'anon', ...parts.map((p) => String(p ?? ''))].join('|');
}

/**
 * Fetch-through TTL cache with in-flight de-duplication. Multiple callers
 * requesting the same key while a fetch is outstanding share one promise.
 * `force: true` (pull-to-refresh) bypasses the TTL but still de-dupes
 * concurrent forced calls for the same key.
 */
export async function cachedFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options?: { force?: boolean }
): Promise<T> {
  const force = options?.force ?? false;

  if (!force) {
    const entry = cache.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.data as T;
  }

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export function isCacheStale(key: string): boolean {
  const entry = cache.get(key);
  return !entry || entry.expiresAt <= Date.now();
}

export function peekCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  return entry ? (entry.data as T) : undefined;
}

/** Invalidates every key sharing a prefix (e.g. a whole session scope, or one resource across params). */
export function invalidatePrefix(prefix: string): void {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
  for (const key of inFlight.keys()) if (key.startsWith(prefix)) inFlight.delete(key);
}

/** Called on logout/session invalidation — clears every cached query and in-flight request. */
export function clearAllCache(): void {
  cache.clear();
  inFlight.clear();
}
