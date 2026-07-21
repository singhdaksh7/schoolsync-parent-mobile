import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { AnnouncementsCard } from '@/components/AnnouncementsCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { styles } from '@/lib/styles';

// Reference-design label was "Notifications" — this app has no push/in-app
// notification system (no expo-notifications dependency, no notification
// feed endpoint). Announcements is the closest real, implemented equivalent
// backed by GET /api/student/announcements, so the tile is renamed to match
// rather than linking to a screen that doesn't exist. See
// lib/student-portal-modules.ts.
export default function StudentAnnouncementsScreen() {
  const { role, branding } = useAuth();
  const dashboard = useStudentDashboard();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
    >
      <SubScreenHeader title="Announcements" color={branding.primaryColor} onBack={() => router.back()} />
      {dashboard.loading && dashboard.announcements.length === 0 ? (
        <ActivityIndicator style={styles.loaderWrap} size="large" color={branding.primaryColor} />
      ) : (
        <AnnouncementsCard announcements={dashboard.announcements} />
      )}
    </ScrollView>
  );
}
