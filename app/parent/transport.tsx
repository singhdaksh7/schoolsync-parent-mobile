import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useParentTransportTrip } from '@/hooks/useParentTransportTrip';
import { TransportCard } from '@/components/TransportCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { styles } from '@/lib/styles';

// One TransportCard per linked child — the backend returns every child's
// trip status in a single call (see useParentTransportTrip), so a guardian
// with multiple children sees all of them here, not just whichever one is
// selected on the grid landing screen.
export default function ParentTransportScreen() {
  const { role, branding } = useAuth();
  const transport = useParentTransportTrip();
  const router = useRouter();

  if (role !== 'PARENT') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={transport.loading} onRefresh={transport.refresh} />}
    >
      <SubScreenHeader title="Transport" color={branding.primaryColor} onBack={() => router.back()} />

      {transport.children.length === 0 && !transport.loading ? (
        <EmptyState icon="bus-outline" title="No children found" message="No linked students found for this account." />
      ) : (
        transport.children.map((child) => (
          <TransportCard
            key={child.studentId}
            title={child.studentName}
            status={child.trip.status}
            startedAt={child.trip.startedAt}
            location={child.location}
            routeName={child.route.name}
            stopName={child.stop?.name ?? null}
            loading={false}
            error={transport.error}
            color={branding.primaryColor}
            emptyLabel="No active trip."
          />
        ))
      )}
    </ScrollView>
  );
}
