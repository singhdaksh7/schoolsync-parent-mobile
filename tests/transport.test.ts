import {
  deriveCurrentAndNextStop,
  formatTripDuration,
  formatUpdatedAgo,
  sortStopsBySequence,
  totalStudentCount,
  tripStatusLabel,
} from '@/lib/transport';
import type { DriverStop, TransportStopRef } from '@/lib/types';

describe('formatUpdatedAgo — location freshness label', () => {
  const NOW = new Date('2026-07-21T12:00:00.000Z').getTime();

  it('shows "updated just now" for anything under 5s old', () => {
    expect(formatUpdatedAgo(new Date(NOW - 2000).toISOString(), NOW)).toBe('updated just now');
    expect(formatUpdatedAgo(new Date(NOW).toISOString(), NOW)).toBe('updated just now');
  });

  it('shows seconds for 5s-59s', () => {
    expect(formatUpdatedAgo(new Date(NOW - 8000).toISOString(), NOW)).toBe('updated 8s ago');
    expect(formatUpdatedAgo(new Date(NOW - 59000).toISOString(), NOW)).toBe('updated 59s ago');
  });

  it('shows minutes for 1m-59m', () => {
    expect(formatUpdatedAgo(new Date(NOW - 60000).toISOString(), NOW)).toBe('updated 1m ago');
    expect(formatUpdatedAgo(new Date(NOW - 5 * 60000).toISOString(), NOW)).toBe('updated 5m ago');
  });

  it('shows hours at 60m and above', () => {
    expect(formatUpdatedAgo(new Date(NOW - 60 * 60000).toISOString(), NOW)).toBe('updated 1h ago');
    expect(formatUpdatedAgo(new Date(NOW - 3 * 60 * 60000).toISOString(), NOW)).toBe('updated 3h ago');
  });

  it('never shows a negative age when the clock is slightly out of sync (future timestamp)', () => {
    expect(formatUpdatedAgo(new Date(NOW + 5000).toISOString(), NOW)).toBe('updated just now');
  });

  it('falls back to "updated just now" for an unparseable timestamp instead of throwing', () => {
    expect(formatUpdatedAgo('not-a-date', NOW)).toBe('updated just now');
  });
});

describe('sortStopsBySequence', () => {
  it('sorts by sequence ascending without mutating the input', () => {
    const stops = [{ sequence: 3 }, { sequence: 1 }, { sequence: 2 }];
    const sorted = sortStopsBySequence(stops);
    expect(sorted.map((s) => s.sequence)).toEqual([1, 2, 3]);
    expect(stops.map((s) => s.sequence)).toEqual([3, 1, 2]);
  });
});

describe('totalStudentCount', () => {
  it('sums per-stop counts', () => {
    const stops: DriverStop[] = [
      { id: '1', sequence: 1, name: 'Stop A', studentCount: 4 },
      { id: '2', sequence: 2, name: 'Stop B', studentCount: 3 },
    ];
    expect(totalStudentCount(stops)).toBe(7);
  });

  it('returns 0 for an empty route', () => {
    expect(totalStudentCount([])).toBe(0);
  });
});

describe('deriveCurrentAndNextStop', () => {
  const stops: TransportStopRef[] = [
    { id: 'a', name: 'Stop A', sequence: 1 },
    { id: 'b', name: 'Stop B', sequence: 2 },
    { id: 'c', name: 'Stop C', sequence: 3 },
  ];

  it('returns nulls for an empty stop list', () => {
    expect(deriveCurrentAndNextStop([], 'a')).toEqual({ currentStop: null, nextStop: null });
  });

  it('with no currentStopId, next is specifically the first stop in sequence', () => {
    const result = deriveCurrentAndNextStop(stops, undefined);
    expect(result.currentStop).toBeNull();
    expect(result.nextStop).toEqual(stops[0]);
  });

  it('treats an explicit null currentStopId the same as undefined', () => {
    const result = deriveCurrentAndNextStop(stops, null);
    expect(result.currentStop).toBeNull();
    expect(result.nextStop).toEqual(stops[0]);
  });

  it('resolves current/next from a mid-route stop id', () => {
    const result = deriveCurrentAndNextStop(stops, 'b');
    expect(result.currentStop).toEqual(stops[1]);
    expect(result.nextStop).toEqual(stops[2]);
  });

  it('next is null once the current stop is the last one', () => {
    const result = deriveCurrentAndNextStop(stops, 'c');
    expect(result.currentStop).toEqual(stops[2]);
    expect(result.nextStop).toBeNull();
  });

  it('treats an unknown currentStopId as "not started yet" rather than throwing', () => {
    const result = deriveCurrentAndNextStop(stops, 'not-a-real-stop-id');
    expect(result.currentStop).toBeNull();
    expect(result.nextStop).toEqual(stops[0]);
  });

  it('works correctly even if the input stops are out of sequence order', () => {
    const shuffled = [stops[2], stops[0], stops[1]];
    const result = deriveCurrentAndNextStop(shuffled, 'a');
    expect(result.currentStop).toEqual(stops[0]);
    expect(result.nextStop).toEqual(stops[1]);
  });
});

describe('tripStatusLabel', () => {
  it('reports no active trip', () => {
    expect(tripStatusLabel(null)).toBe('No active trip');
    expect(tripStatusLabel(undefined)).toBe('No active trip');
  });

  it('reports an in-progress trip', () => {
    expect(tripStatusLabel({ status: 'ACTIVE' })).toBe('Trip in progress');
  });

  it('reports an ended trip', () => {
    expect(tripStatusLabel({ status: 'ENDED' })).toBe('Trip ended');
  });
});

describe('formatTripDuration', () => {
  const NOW = new Date('2026-07-21T12:30:00.000Z').getTime();

  it('reports "less than a minute" just after start', () => {
    expect(formatTripDuration(new Date(NOW - 10000).toISOString(), null, NOW)).toBe('less than a minute');
  });

  it('uses singular "minute" for exactly 1 minute', () => {
    expect(formatTripDuration(new Date(NOW - 60000).toISOString(), null, NOW)).toBe('1 minute');
  });

  it('uses plural "minutes" for more than 1 minute, using now() when the trip is still active', () => {
    expect(formatTripDuration(new Date(NOW - 15 * 60000).toISOString(), null, NOW)).toBe('15 minutes');
  });

  it('uses endedAt instead of now() once the trip has ended', () => {
    const started = new Date(NOW - 40 * 60000).toISOString();
    const ended = new Date(NOW - 10 * 60000).toISOString();
    // Elapsed should be 30 minutes (start -> end), not 40 (start -> now).
    expect(formatTripDuration(started, ended, NOW)).toBe('30 minutes');
  });

  it('returns an empty string for an unparseable start time', () => {
    expect(formatTripDuration('not-a-date', null, NOW)).toBe('');
  });
});
