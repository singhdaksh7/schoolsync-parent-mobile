import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { MarksCard } from '@/components/MarksCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { styles } from '@/lib/styles';

// Reference-design label was "Internal Marks" — renamed to match this app's
// (and the backend's) existing terminology, "Marks", already used on the
// dashboard's MarksCard. See lib/student-portal-modules.ts's header comment.
export default function StudentMarksScreen() {
  const { role, branding } = useAuth();
  const dashboard = useStudentDashboard();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
    >
      <SubScreenHeader title="Marks" color={branding.primaryColor} onBack={() => router.back()} />
      {dashboard.loading && dashboard.marks.length === 0 ? (
        <ActivityIndicator style={styles.loaderWrap} size="large" color={branding.primaryColor} />
      ) : (
        <MarksCard marks={dashboard.marks} />
      )}
    </ScrollView>
  );
}
