import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { TimetableCard } from '@/components/TimetableCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
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
        <ActivityIndicator style={styles.loaderWrap} size="large" color={branding.primaryColor} />
      ) : (
        <TimetableCard timetable={dashboard.timetable} />
      )}
    </ScrollView>
  );
}
