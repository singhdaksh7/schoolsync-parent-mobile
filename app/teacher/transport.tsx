import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransportCard } from '@/components/TransportCard';
import { EmptyState } from '@/components/EmptyState';
import { useTeacherTransportTrips } from '@/hooks/useTeacherTransportTrips';
import { useAuth } from '@/lib/auth-context';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

export default function TeacherTransportScreen() {
  const { role } = useAuth();
  const transport = useTeacherTransportTrips();
  const insets = useSafeAreaInsets();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={transport.loading} onRefresh={transport.refresh} />}
    >
      <View style={[styles.teacherHeader, { paddingTop: insets.top + styles.teacherHeader.paddingVertical }]}>
        <Text style={styles.teacherHeaderTitle}>Transport</Text>
        {transport.loading ? <ActivityIndicator color="#fff" /> : null}
      </View>

      {transport.error ? <Text style={styles.errorBanner}>{transport.error}</Text> : null}

      {transport.trips.length === 0 && !transport.loading ? (
        <EmptyState icon="bus-outline" title="No active trips" message="No active bus trips right now." />
      ) : (
        transport.trips.map((trip) => (
          <TransportCard
            key={trip.id}
            title="Transport"
            status={trip.status}
            startedAt={trip.startedAt}
            location={trip.location}
            routeName={trip.route.name}
            loading={false}
            error={null}
            color={TeacherTheme.colors.primary}
          />
        ))
      )}
    </ScrollView>
  );
}
