import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { DriverRouteResponse, DriverTripEndResponse, DriverTripStartResponse, TripStatus } from '@/lib/types';

// Not session-sensitive (no PII, just a trip id/status/timestamps) so plain
// AsyncStorage is fine here — unlike lib/session.ts's bearer token, which
// must live in SecureStore.
const TRIP_STORAGE_KEY = 'schoolsync.driver.trip.v1';

type PersistedTrip = { tripId: string; status: TripStatus; startedAt: string; endedAt: string | null };

async function loadPersistedTrip(): Promise<PersistedTrip | null> {
  try {
    const raw = await AsyncStorage.getItem(TRIP_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTrip;
  } catch {
    return null;
  }
}

async function persistTrip(trip: PersistedTrip | null): Promise<void> {
  try {
    if (!trip) await AsyncStorage.removeItem(TRIP_STORAGE_KEY);
    else await AsyncStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trip));
  } catch {
    // Non-fatal — worst case the trip just doesn't resume across a restart.
  }
}

/**
 * Drives the driver's own route view + trip start/end/status (Phase 2A).
 *
 * There is no GET-active-trip endpoint for drivers (see the Transport
 * Driver Portal spec) — "current trip status" is purely local app state,
 * set from the start/end response and persisted so a relaunch mid-trip can
 * restore the status display.
 */
export function useDriverTrip() {
  const { token } = useAuth();
  const [route, setRoute] = useState<DriverRouteResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [trip, setTrip] = useState<PersistedTrip | null>(null);
  const [restoringTrip, setRestoringTrip] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);

  const loadRoute = useCallback(
    async (force = false) => {
      if (!token) return;
      setRouteLoading(true);
      setRouteError(null);
      try {
        const result = await apiRequest<DriverRouteResponse>('/api/mobile/driver/route', {}, token);
        setRoute(result);
      } catch (err) {
        setRouteError(err instanceof Error ? err.message : 'Failed to load route.');
      } finally {
        setRouteLoading(false);
      }
      // `force` is accepted for symmetry with other hooks' handleRefresh
      // pattern; the route has no cache layer to bypass here.
      void force;
    },
    [token]
  );

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  // Resume the locally known trip status that was already set when the app
  // was last closed — see the JSDoc above for why this reads local storage
  // instead of a backend "current trip" endpoint (none exists for drivers).
  useEffect(() => {
    let active = true;
    (async () => {
      const persisted = await loadPersistedTrip();
      if (active) {
        if (persisted) setTrip(persisted);
        setRestoringTrip(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const startTrip = useCallback(async () => {
    if (!token) return;
    setStarting(true);
    setTripError(null);
    try {
      const result = await apiRequest<DriverTripStartResponse>('/api/mobile/driver/trips/start', { method: 'POST' }, token);
      const nextTrip: PersistedTrip = { tripId: result.tripId, status: result.status, startedAt: result.startedAt, endedAt: null };
      setTrip(nextTrip);
      await persistTrip(nextTrip);
    } catch (err) {
      setTripError(err instanceof Error ? err.message : 'Failed to start trip.');
    } finally {
      setStarting(false);
    }
  }, [token]);

  const endTrip = useCallback(async () => {
    if (!token || !trip) return;
    setEnding(true);
    setTripError(null);
    try {
      const result = await apiRequest<DriverTripEndResponse>(
        `/api/mobile/driver/trips/${trip.tripId}/end`,
        { method: 'POST' },
        token
      );
      const nextTrip: PersistedTrip = { tripId: result.tripId, status: result.status, startedAt: result.startedAt, endedAt: result.endedAt };
      setTrip(nextTrip);
      await persistTrip(null);
    } catch (err) {
      setTripError(err instanceof Error ? err.message : 'Failed to end trip.');
    } finally {
      setEnding(false);
    }
  }, [token, trip]);

  return {
    route,
    routeLoading,
    routeError,
    stops: route?.stops ?? [],
    trip,
    restoringTrip,
    starting,
    ending,
    tripError,
    startTrip,
    endTrip,
    handleRefresh: () => loadRoute(true),
  };
}
