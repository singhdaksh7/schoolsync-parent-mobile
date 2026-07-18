// Regression test for the physical-Android TeacherHomeScreen crash:
// `TypeError: Cannot read property 'filter' of undefined`, thrown from the
// `useMemo` in app/teacher/index.tsx (`schedule.slots.filter(...)`).
//
// Root cause: lib/api-client.ts's doRequest() called
// `response.json().catch(() => ({}))` BEFORE checking `response.ok`, so a
// 200 response with an unparseable/empty body (a real physical-network
// condition) silently resolved to `{}` instead of throwing. useTeacherSchedule
// then did `setSlots(result.slots)` with `result.slots === undefined`, and the
// next render's `useMemo` called `.filter()` on that `undefined`.
//
// This test reproduces the EXACT response shape that crashed the app (a 200
// with a body that fails to parse) and proves useTeacherSchedule's `slots`
// state is normalized to `[]`, not `undefined` — which is what the
// TeacherHomeScreen `useMemo` needs to survive without throwing.
import { renderHook } from './test-utils/render-hook';
import { clearAllCache } from '@/lib/query-cache';

jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'test-token' }) }));

import { useTeacherSchedule } from '@/hooks/useTeacherSchedule';

describe('TeacherHomeScreen crash regression — malformed 200 must never produce undefined arrays', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearAllCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('useTeacherSchedule normalizes `slots` to [] (not undefined) when /api/teacher/timetable returns a 200 with an unparseable body', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => 'not json',
    })) as unknown as typeof fetch;

    const hook = renderHook(() => useTeacherSchedule());
    await hook.act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // The fetch boundary (api-client.ts) now throws MALFORMED_RESPONSE for
    // this case, which the hook catches into `error` — `slots` must stay the
    // safe [] default, never undefined.
    expect(hook.result.slots).toEqual([]);
    expect(Array.isArray(hook.result.slots)).toBe(true);
    // The exact expression that crashed Android must be safe to run now.
    expect(() => hook.result.slots.filter((slot) => slot.dayOfWeek === 1)).not.toThrow();
  });

  it('useTeacherSchedule normalizes `slots` to [] when the backend returns a 200 with valid JSON that is missing the field entirely', async () => {
    // A second way the same undefined could occur — a valid but
    // wrong-shaped success body (e.g. an envelope change) — must be caught
    // by the hook-level normalization even though the JSON itself parses fine.
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => JSON.stringify({}),
    })) as unknown as typeof fetch;

    const hook = renderHook(() => useTeacherSchedule());
    await hook.act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(hook.result.slots).toEqual([]);
    expect(() => hook.result.slots.filter((slot) => slot.dayOfWeek === 1)).not.toThrow();
  });

  it('useTeacherSchedule still loads real slots normally on a well-formed response', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () =>
        JSON.stringify({
          teachingSections: [],
          slots: [{ dayOfWeek: 1, period: 1, subject: 'Math', className: '8', sectionName: 'A' }],
          periodsPerDay: 6,
        }),
    })) as unknown as typeof fetch;

    const hook = renderHook(() => useTeacherSchedule());
    await hook.act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(hook.result.slots).toHaveLength(1);
  });
});
