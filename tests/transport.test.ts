import {
  formatTripDuration,
  formatUpdatedAgo,
  liveTripStatusLabel,
  sortStopsBySequence,
  totalStudentCount,
  tripStatusLabel,
} from '@/lib/transport';
import type { DriverStop } from '@/lib/types';

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

describe('liveTripStatusLabel', () => {
  it('reports an in-progress trip', () => {
    expect(liveTripStatusLabel('ACTIVE')).toBe('Trip in progress');
  });

  it('reports a scheduled trip', () => {
    expect(liveTripStatusLabel('SCHEDULED')).toBe('Trip scheduled');
  });

  it('reports a completed trip', () => {
    expect(liveTripStatusLabel('COMPLETED')).toBe('Trip completed');
  });

  it('reports a cancelled trip', () => {
    expect(liveTripStatusLabel('CANCELLED')).toBe('Trip cancelled');
  });

  it('reports the NO_ACTIVE_TRIP sentinel as "no active trip", never an ended-trip display', () => {
    expect(liveTripStatusLabel('NO_ACTIVE_TRIP')).toBe('No active trip');
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
