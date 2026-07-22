import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { AttendanceCard } from '@/components/AttendanceCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { styles } from '@/lib/styles';

export default function ParentAttendanceScreen() {
  const { role, branding } = useAuth();
  const dashboard = useParentDashboard();
  const router = useRouter();

  if (role !== 'PARENT') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
    >
      <SubScreenHeader title="Attendance" color={branding.primaryColor} onBack={() => router.back()} />
      {dashboard.loadingData && dashboard.attendance.length === 0 ? (
        <ActivityIndicator style={styles.loaderWrap} size="large" color={branding.primaryColor} />
      ) : (
        <AttendanceCard attendance={dashboard.attendance} summary={dashboard.attendanceSummary} />
      )}
    </ScrollView>
  );
}
