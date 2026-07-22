// Pure Transport (Driver Portal) business logic, factored out of the
// driver/parent/teacher transport screens so it's unit-testable without
// rendering expo-router navigation — same pattern as lib/work-modules.ts.
//
// Text-only UI (Phase 2C, item 25): no map rendering anywhere in this
// module or its consumers. Location is only ever present while a trip is
// ACTIVE — there is no location-history endpoint anywhere in this system,
// so nothing here should ever try to reconstruct a path or a trail.
import type { DriverStop, LiveTripStatus, TripStatus } from './types';

/** Formats "how long ago" a live-location timestamp was received, e.g.
 * "updated just now" / "updated 8s ago" / "updated 3m ago" / "updated 2h ago".
 * `nowMs` is injectable so this is deterministic in tests. */
export function formatUpdatedAgo(updatedAtIso: string, nowMs: number = Date.now()): string {
  const updatedMs = new Date(updatedAtIso).getTime();
  if (Number.isNaN(updatedMs)) return 'updated just now';

  const diffSeconds = Math.max(0, Math.floor((nowMs - updatedMs) / 1000));
  if (diffSeconds < 5) return 'updated just now';
  if (diffSeconds < 60) return `updated ${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `updated ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `updated ${diffHours}h ago`;
}

/** Sorts a driver's stop list into sequence order — the backend is assumed
 * to already return stops in sequence, but sorting defensively here means a
 * misordered response never silently misrenders the route. */
export function sortStopsBySequence<T extends { sequence: number }>(stops: T[]): T[] {
  return [...stops].sort((a, b) => a.sequence - b.sequence);
}

/** Total student count across every stop on a driver's route — used for a
 * one-line route summary ("N stops, M students total"). */
export function totalStudentCount(stops: DriverStop[]): number {
  return stops.reduce((sum, stop) => sum + (stop.studentCount || 0), 0);
}

/** Text-only trip status line for the driver's own start/end screen. */
export function tripStatusLabel(trip: { status: TripStatus } | null | undefined): string {
  if (!trip) return 'No active trip';
  return trip.status === 'ACTIVE' ? 'Trip in progress' : 'Trip ended';
}

/** Text-only trip status line for the parent/teacher live-trip view, which
 * reads Prisma's real Trip.status enum (plus the parent endpoint's
 * synthetic NO_ACTIVE_TRIP sentinel) rather than the driver's own
 * 'ACTIVE'|'ENDED' status. There is no endedAt on NO_ACTIVE_TRIP, so this
 * never attempts an "ended at HH:MM" label — just "no active trip". */
export function liveTripStatusLabel(status: LiveTripStatus | 'NO_ACTIVE_TRIP'): string {
  switch (status) {
    case 'ACTIVE':
      return 'Trip in progress';
    case 'SCHEDULED':
      return 'Trip scheduled';
    case 'COMPLETED':
      return 'Trip completed';
    case 'CANCELLED':
      return 'Trip cancelled';
    default:
      return 'No active trip';
  }
}

/** Elapsed-time label for an active/ended trip, e.g. "12m elapsed" /
 * "started 5m ago". Kept separate from formatUpdatedAgo (which is about
 * location freshness, not trip duration) even though the math is similar,
 * so the two concepts never get accidentally conflated in a screen. */
export function formatTripDuration(startedAtIso: string, endedAtIso: string | null, nowMs: number = Date.now()): string {
  const startMs = new Date(startedAtIso).getTime();
  if (Number.isNaN(startMs)) return '';
  const endMs = endedAtIso ? new Date(endedAtIso).getTime() : nowMs;
  const diffMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));
  if (diffMinutes < 1) return 'less than a minute';
  if (diffMinutes === 1) return '1 minute';
  return `${diffMinutes} minutes`;
}
