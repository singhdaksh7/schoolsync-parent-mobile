import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import { formatTripDuration, formatUpdatedAgo, liveTripStatusLabel } from '@/lib/transport';
import type { LiveTripStatus, TransportLocation } from '@/lib/types';

/**
 * Text-only live-trip status card, shared by the parent and teacher
 * transport screens (Phase 2C). Deliberately no map — see the Phase 2C
 * report for why (react-native-maps is explicitly deferred).
 *
 * Ticks its own 1s clock purely to keep the "updated Ns ago" label fresh
 * between polls (the underlying trip data itself only refreshes on the
 * ~10s poll interval in useParentTransportTrip/useTeacherTransportTrips).
 *
 * `status` is the real backend status (LiveTripStatus, or the parent
 * endpoint's synthetic NO_ACTIVE_TRIP sentinel) — NOT the driver's own
 * 'ACTIVE'|'ENDED' TripStatus. NO_ACTIVE_TRIP carries no endedAt, so this
 * never renders a "trip ended at HH:MM" line — only "no active trip".
 */
export function TransportCard({
  status,
  startedAt,
  location,
  routeName,
  stopName,
  loading,
  error,
  color,
  title = 'Transport',
  emptyLabel = 'No trip today.',
}: {
  status: LiveTripStatus | 'NO_ACTIVE_TRIP';
  startedAt: string | null;
  location: TransportLocation | null;
  routeName: string | null;
  stopName?: string | null;
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

  const hasTrip = status !== 'NO_ACTIVE_TRIP';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {loading ? <ActivityIndicator color={color} /> : null}
      </View>
      {error ? <Text style={styles.inlineErrorText}>{error}</Text> : null}
      {hasTrip ? (
        <>
          <Text style={styles.emptyText}>{liveTripStatusLabel(status)}</Text>
          {routeName ? <Text style={styles.listRowSubtext}>{routeName}</Text> : null}
          {stopName ? <Text style={styles.listRowSubtext}>Stop: {stopName}</Text> : null}
          {status === 'ACTIVE' && startedAt ? (
            <Text style={styles.listRowSubtext}>Started {formatTripDuration(startedAt, null)} ago</Text>
          ) : null}
          {status === 'ACTIVE' && location ? <Text style={styles.listRowSubtext}>{formatUpdatedAgo(location.updatedAt)}</Text> : null}
        </>
      ) : (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      )}
    </View>
  );
}
