import { CACHE_TTL, cacheKey, cachedFetch, clearAllCache, invalidatePrefix, isCacheStale } from '@/lib/query-cache';

describe('query-cache — TTL cache + in-flight de-duplication', () => {
  let currentTime = 1_000_000;

  beforeEach(() => {
    clearAllCache();
    currentTime = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('serves a cached value without re-calling the fetcher while fresh', async () => {
    const fetcher = jest.fn(async () => 'first');
    const key = cacheKey('token-a', 'resource');

    expect(await cachedFetch(key, 1000, fetcher)).toBe('first');
    expect(await cachedFetch(key, 1000, fetcher)).toBe('first');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refetches once the TTL has expired', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const key = cacheKey('token-a', 'resource');

    expect(await cachedFetch(key, 1000, fetcher)).toBe('first');
    currentTime += 1001;
    expect(isCacheStale(key)).toBe(true);
    expect(await cachedFetch(key, 1000, fetcher)).toBe('second');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('force bypasses the TTL even when the entry is fresh', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const key = cacheKey('token-a', 'resource');

    expect(await cachedFetch(key, 60_000, fetcher)).toBe('first');
    expect(await cachedFetch(key, 60_000, fetcher, { force: true })).toBe('second');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('de-duplicates concurrent calls for the same key into one fetch', async () => {
    let resolveFetch: (value: string) => void = () => undefined;
    const fetcher = jest.fn(() => new Promise<string>((resolve) => (resolveFetch = resolve)));
    const key = cacheKey('token-a', 'resource');

    const first = cachedFetch(key, 1000, fetcher);
    const second = cachedFetch(key, 1000, fetcher);
    resolveFetch('shared');

    expect(await first).toBe('shared');
    expect(await second).toBe('shared');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('isolates keys by session/token — one token never reads another token’s cached entry', async () => {
    const fetcherA = jest.fn(async () => 'school-a-data');
    const fetcherB = jest.fn(async () => 'school-b-data');

    expect(await cachedFetch(cacheKey('token-a', 'resource'), 1000, fetcherA)).toBe('school-a-data');
    expect(await cachedFetch(cacheKey('token-b', 'resource'), 1000, fetcherB)).toBe('school-b-data');
    expect(fetcherA).toHaveBeenCalledTimes(1);
    expect(fetcherB).toHaveBeenCalledTimes(1);
  });

  it('invalidatePrefix only clears matching keys, not the whole cache', async () => {
    const homeworkFetcher = jest.fn().mockResolvedValueOnce('hw1').mockResolvedValueOnce('hw2');
    const attendanceFetcher = jest.fn(async () => 'attendance');
    const homeworkKey = cacheKey('token-a', 'teacher-homework');
    const attendanceKey = cacheKey('token-a', 'teacher-self-attendance');

    await cachedFetch(homeworkKey, 60_000, homeworkFetcher);
    await cachedFetch(attendanceKey, 60_000, attendanceFetcher);

    invalidatePrefix(homeworkKey);

    await cachedFetch(homeworkKey, 60_000, homeworkFetcher);
    await cachedFetch(attendanceKey, 60_000, attendanceFetcher);

    expect(homeworkFetcher).toHaveBeenCalledTimes(2); // refetched after invalidation
    expect(attendanceFetcher).toHaveBeenCalledTimes(1); // untouched
  });

  it('clearAllCache wipes every key (used on logout)', async () => {
    const fetcher = jest.fn(async () => 'value');
    const key = cacheKey('token-a', 'resource');

    await cachedFetch(key, 60_000, fetcher);
    clearAllCache();
    await cachedFetch(key, 60_000, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('documents the guidance TTL constants exist for every named resource', () => {
    expect(CACHE_TTL.FEATURE_ENTITLEMENTS).toBe(15 * 60 * 1000);
    expect(CACHE_TTL.BRANDING).toBe(24 * 60 * 60 * 1000);
    expect(CACHE_TTL.TEACHER_PERMISSIONS).toBe(10 * 60 * 1000);
    expect(CACHE_TTL.TEACHER_OPERATIONS_SELF_STATUS).toBe(30 * 1000);
  });
});
