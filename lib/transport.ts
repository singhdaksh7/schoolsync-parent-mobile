// Pure Transport (Driver Portal) business logic, factored out of the
// driver/parent/teacher transport screens so it's unit-testable without
// rendering expo-router navigation — same pattern as lib/work-modules.ts.
//
// Text-only UI (Phase 2C, item 25): no map rendering anywhere in this
// module or its consumers. Location is only ever present while a trip is
// ACTIVE — there is no location-history endpoint anywhere in this system,
// so nothing here should ever try to reconstruct a path or a trail.
import type { DriverStop, TransportStopRef, TripStatus } from './types';

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

/**
 * Derives the current and next stop for a text-only live-trip display.
 * Works from a sequence-ordered stop list plus a `currentStopId` — this is
 * intentionally generic so it can be reused wherever a stop list + a
 * "we are here" id shows up (driver's own route context, or a parent/teacher
 * trip response that happens to include `stops` + `currentStop`).
 *
 * - No stops -> both null.
 * - No currentStopId (trip hasn't reached a stop yet, or the field is
 *   simply absent from the response) -> current is null, next is the first
 *   stop in sequence.
 * - currentStopId not found in the list -> treated the same as "not
 *   started yet" rather than throwing, since a route can change between
 *   when a trip started and when this renders.
 * - currentStopId is the last stop -> next is null (end of route).
 */
export function deriveCurrentAndNextStop(
  stops: TransportStopRef[],
  currentStopId: string | null | undefined
): { currentStop: TransportStopRef | null; nextStop: TransportStopRef | null } {
  const sorted = sortStopsBySequence(stops);
  if (sorted.length === 0) return { currentStop: null, nextStop: null };

  if (!currentStopId) return { currentStop: null, nextStop: sorted[0] };

  const index = sorted.findIndex((stop) => stop.id === currentStopId);
  if (index === -1) return { currentStop: null, nextStop: sorted[0] };

  return { currentStop: sorted[index], nextStop: sorted[index + 1] ?? null };
}

/** Text-only trip status line for a driver/parent/teacher screen. */
export function tripStatusLabel(trip: { status: TripStatus } | null | undefined): string {
  if (!trip) return 'No active trip';
  return trip.status === 'ACTIVE' ? 'Trip in progress' : 'Trip ended';
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
