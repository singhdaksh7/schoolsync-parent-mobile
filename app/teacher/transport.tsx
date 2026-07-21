import React from 'react';
import { Redirect } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { ActorHeader } from '@/components/BrandHeader';
import { TransportCard } from '@/components/TransportCard';
import { useTeacherTransportTrips } from '@/hooks/useTeacherTransportTrips';
import { useAuth } from '@/lib/auth-context';
import { roleLabel } from '@/lib/format';
import { styles } from '@/lib/styles';

export default function TeacherTransportScreen() {
  const { role, user, branding, logout } = useAuth();
  const transport = useTeacherTransportTrips();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={transport.loading} onRefresh={transport.refresh} />}
    >
      <ActorHeader branding={branding} userName={user?.name || ''} roleLabel={roleLabel(role)} onLogout={logout} />

      {transport.error ? <Text style={styles.errorBanner}>{transport.error}</Text> : null}

      {transport.trips.length === 0 && !transport.loading ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.sectionTitle}>Transport</Text>
          <Text style={styles.emptyText}>No active bus trips right now.</Text>
        </View>
      ) : (
        transport.trips.map((trip) => (
          <TransportCard
            key={trip.id}
            trip={trip}
            loading={false}
            error={null}
            color={branding.primaryColor}
            title={trip.routeName || 'Transport'}
          />
        ))
      )}
    </ScrollView>
  );
}
