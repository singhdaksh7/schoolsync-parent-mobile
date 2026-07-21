// Background location tracking for an ACTIVE driver trip (Phase 2B).
//
// IMPORTANT — Expo Go: registering a background location TaskManager task
// requires a custom dev client (EAS development build). This app can no
// longer run in Expo Go once this module is loaded — see the app.json
// `expo-location` plugin config and the Phase 2B report for details.
//
// Ping cadence: ~10-15s while a trip is ACTIVE (PING_INTERVAL_MS below),
// matching POST /api/mobile/driver/trips/[tripId]/ping's {lat, lng} body.
//
// Offline/reconnect policy ("drop-and-resume", see lib/ping-slot.ts): only
// the single most recent GPS fix is ever kept. A failed/offline ping is
// dropped, not retried or queued — the next location update naturally
// carries a fresher position, so replaying a stale one on reconnect would
// add no value and risks reporting a position 30-60s old as if it were
// current. At most one ping is ever in flight at a time (the `sending`
// guard below); a fix that arrives while a request is still in flight just
// overwrites the slot and is picked up by the same drain loop once the
// in-flight request settles.
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { apiRequest } from './api-client';
import { createLatestPositionSlot } from './ping-slot';

export const DRIVER_LOCATION_TASK = 'schoolsync-driver-location-task';
const PING_INTERVAL_MS = 12000;
const MIN_DISTANCE_METERS = 15;

const slot = createLatestPositionSlot();
let sending = false;
let currentTripId: string | null = null;
let currentToken: string | null = null;

async function drain(): Promise<void> {
  if (sending) return;
  sending = true;
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const next = slot.takeLatest();
      if (!next || !currentTripId || !currentToken) return;
      try {
        await apiRequest(
          `/api/mobile/driver/trips/${currentTripId}/ping`,
          { method: 'POST', body: JSON.stringify({ lat: next.lat, lng: next.lng }) },
          currentToken
        );
      } catch {
        // Drop-and-resume: a network/offline failure is swallowed here on
        // purpose. Nothing re-queues `next` — see the module doc above.
      }
    }
  } finally {
    sending = false;
  }
}

if (!TaskManager.isTaskDefined(DRIVER_LOCATION_TASK)) {
  TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }) => {
    if (error) return;
    const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
    const latest = locations && locations.length > 0 ? locations[locations.length - 1] : undefined;
    if (!latest) return;
    slot.set({ lat: latest.coords.latitude, lng: latest.coords.longitude });
    await drain();
  });
}

export type LocationPermissionResult = { granted: true } | { granted: false; reason: string };

async function ensurePermissions(): Promise<LocationPermissionResult> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    return { granted: false, reason: 'Location permission was not granted.' };
  }
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') {
    return { granted: false, reason: 'Background location permission was not granted — the trip can still be tracked in the foreground, but live updates will pause once the app is backgrounded.' };
  }
  return { granted: true };
}

/** Starts background location tracking for an ACTIVE trip. Safe to call
 * even if a previous task registration is still running (e.g. app relaunch
 * mid-trip) — it's stopped and restarted cleanly. */
export async function startDriverLocationTracking(tripId: string, token: string): Promise<LocationPermissionResult> {
  const permission = await ensurePermissions();
  if (!permission.granted) return permission;

  currentTripId = tripId;
  currentToken = token;

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(() => false);
  if (alreadyStarted) {
    await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(() => undefined);
  }

  await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: PING_INTERVAL_MS,
    distanceInterval: MIN_DISTANCE_METERS,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Trip in progress',
      notificationBody: 'Sharing your live location with the school while this trip is active.',
    },
  });

  return { granted: true };
}

/** Stops background location tracking. Called on trip end (and defensively
 * on unmount) so the task never keeps running — and never keeps
 * pinging — after a trip has ended. */
export async function stopDriverLocationTracking(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(() => false);
  if (started) {
    await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(() => undefined);
  }
  currentTripId = null;
  currentToken = null;
}

export async function isDriverLocationTrackingActive(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(() => false);
}
