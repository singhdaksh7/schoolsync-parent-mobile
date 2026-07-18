import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { TimetableCard } from '@/components/TimetableCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { styles } from '@/lib/styles';

// Full-week timetable (GET /api/student/timetable's `timetable` field), as
// opposed to the dashboard's StudentTodayTimetableCard which only shows
// `today`. Reuses the existing TimetableCard (day/period grouped rows via
// DAY_NAMES) rather than inventing new grid-day layout logic.
export default function StudentTimetableScreen() {
  const { role, branding } = useAuth();
  const dashboard = useStudentDashboard();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
    >
      <SubScreenHeader title="Timetable" color={branding.primaryColor} onBack={() => router.back()} />
      {dashboard.loading && dashboard.timetable.length === 0 ? (
        <ActivityIndicator style={styles.loaderWrap} size="large" color={branding.primaryColor} />
      ) : (
        <TimetableCard timetable={dashboard.timetable} />
      )}
    </ScrollView>
  );
}
