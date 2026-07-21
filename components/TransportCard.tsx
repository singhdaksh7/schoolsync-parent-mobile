import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import { deriveCurrentAndNextStop, formatUpdatedAgo, tripStatusLabel } from '@/lib/transport';
import type { TransportTrip } from '@/lib/types';

/**
 * Text-only live-trip status card, shared by the parent and teacher
 * transport screens (Phase 2C). Deliberately no map — see the Phase 2C
 * report for why (react-native-maps is explicitly deferred).
 *
 * Ticks its own 1s clock purely to keep the "updated Ns ago" label fresh
 * between polls (the underlying `trip` data itself only refreshes on the
 * ~10s poll interval in useParentTransportTrip/useTeacherTransportTrips).
 */
export function TransportCard({
  trip,
  loading,
  error,
  color,
  title = 'Transport',
  emptyLabel = 'No trip today.',
}: {
  trip: TransportTrip | null;
  loading: boolean;
  error: string | null;
  color: string;
  title?: string;
  emptyLabel?: string;
}) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const stopsList = trip?.stops;
  const derived = stopsList && stopsList.length > 0 ? deriveCurrentAndNextStop(stopsList, trip?.currentStop?.id ?? null) : null;
  const currentStop = derived ? derived.currentStop : (trip?.currentStop ?? null);
  const nextStop = derived ? derived.nextStop : (trip?.nextStop ?? null);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {loading ? <ActivityIndicator color={color} /> : null}
      </View>
      {error ? <Text style={styles.inlineErrorText}>{error}</Text> : null}
      {trip ? (
        <>
          <Text style={styles.emptyText}>{tripStatusLabel(trip)}</Text>
          {trip.routeName ? <Text style={styles.listRowSubtext}>{trip.routeName}</Text> : null}
          {trip.status === 'ACTIVE' ? (
            <>
              {currentStop ? <Text style={styles.listRowSubtext}>Current stop: {currentStop.name}</Text> : null}
              {nextStop ? <Text style={styles.listRowSubtext}>Next stop: {nextStop.name}</Text> : null}
              {trip.location ? <Text style={styles.listRowSubtext}>{formatUpdatedAgo(trip.location.updatedAt)}</Text> : null}
            </>
          ) : null}
        </>
      ) : (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      )}
    </View>
  );
}
