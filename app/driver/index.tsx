import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { ActorHeader } from '@/components/BrandHeader';
import { useDriverTrip } from '@/hooks/useDriverTrip';
import { useAuth } from '@/lib/auth-context';
import { roleLabel } from '@/lib/format';
import { styles } from '@/lib/styles';
import { formatTripDuration, sortStopsBySequence, totalStudentCount, tripStatusLabel } from '@/lib/transport';

export default function DriverScreen() {
  // Hooks are called unconditionally, before the role-based early return
  // below — matching the pattern already used in app/parent/index.tsx and
  // app/teacher/index.tsx (a rules-of-hooks bug from doing this the other
  // way around was previously fixed in this repo).
  const { role, user, branding, logout } = useAuth();
  const driver = useDriverTrip();

  if (role !== 'DRIVER') return <Redirect href="/" />;

  const stops = sortStopsBySequence(driver.stops);
  const isActive = driver.trip?.status === 'ACTIVE';
  const totalStudents = totalStudentCount(stops);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={driver.routeLoading} onRefresh={driver.handleRefresh} />}
    >
      <ActorHeader branding={branding} userName={user?.name || ''} roleLabel={roleLabel(role)} onLogout={logout} />

      <View style={[styles.card, styles.attendanceCard]}>
        <Text style={styles.sectionTitle}>Trip Status</Text>
        {driver.restoringTrip ? (
          <ActivityIndicator color={branding.primaryColor} />
        ) : (
          <>
            <Text style={styles.emptyText}>{tripStatusLabel(driver.trip)}</Text>
            {driver.trip && isActive ? (
              <Text style={styles.listRowSubtext}>Started {formatTripDuration(driver.trip.startedAt, null)} ago</Text>
            ) : null}
            {driver.trip && !isActive && driver.trip.endedAt ? (
              <Text style={styles.listRowSubtext}>Lasted {formatTripDuration(driver.trip.startedAt, driver.trip.endedAt)}</Text>
            ) : null}
            {driver.tripError ? <Text style={styles.inlineErrorText}>{driver.tripError}</Text> : null}

            <Pressable
              style={[
                styles.primaryButton,
                { backgroundColor: isActive ? '#dc2626' : branding.primaryColor },
                (driver.starting || driver.ending) && styles.primaryButtonDisabled,
              ]}
              onPress={isActive ? driver.endTrip : driver.startTrip}
              disabled={driver.starting || driver.ending}
            >
              {driver.starting || driver.ending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>{isActive ? 'End Trip' : 'Start Trip'}</Text>
              )}
            </Pressable>
          </>
        )}
      </View>

      <View style={[styles.card, styles.lastCard]}>
        <Text style={styles.sectionTitle}>{driver.route?.routeName || 'Route'}</Text>
        {driver.routeError ? <Text style={styles.inlineErrorText}>{driver.routeError}</Text> : null}
        {stops.length > 0 ? (
          <Text style={styles.listRowSubtext}>
            {stops.length} stop{stops.length === 1 ? '' : 's'} · {totalStudents} student{totalStudents === 1 ? '' : 's'} total
          </Text>
        ) : null}
        {stops.map((stop) => (
          <View key={stop.id} style={styles.teacherListItem}>
            <View style={[styles.periodBadge, { borderColor: branding.primaryColor }]}>
              <Text style={[styles.periodBadgeText, { color: branding.primaryColor }]}>{stop.sequence}</Text>
            </View>
            <View style={styles.teacherListBody}>
              <Text style={styles.listRowTitle}>{stop.name}</Text>
              <Text style={styles.listRowSubtext}>
                {stop.studentCount} student{stop.studentCount === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        ))}
        {!driver.routeLoading && stops.length === 0 && !driver.routeError ? (
          <Text style={styles.emptyText}>No stops found for this route.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
