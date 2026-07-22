import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { TimetableCard } from '@/components/TimetableCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { CardSkeleton } from '@/components/Skeleton';
import { styles } from '@/lib/styles';

export default function ParentTimetableScreen() {
  const { role, branding } = useAuth();
  const dashboard = useParentDashboard();
  const router = useRouter();

  if (role !== 'PARENT') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
    >
      <SubScreenHeader title="Timetable" color={branding.primaryColor} onBack={() => router.back()} />
      {dashboard.loadingData && dashboard.timetable.length === 0 ? (
        <CardSkeleton rows={5} />
      ) : (
        <TimetableCard timetable={dashboard.timetable} />
      )}
    </ScrollView>
  );
}
