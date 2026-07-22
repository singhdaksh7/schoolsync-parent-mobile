import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { MarksCard } from '@/components/MarksCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { styles } from '@/lib/styles';

export default function ParentMarksScreen() {
  const { role, branding } = useAuth();
  const dashboard = useParentDashboard();
  const router = useRouter();

  if (role !== 'PARENT') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
    >
      <SubScreenHeader title="Marks" color={branding.primaryColor} onBack={() => router.back()} />
      {dashboard.loadingData && dashboard.marks.length === 0 ? (
        <ActivityIndicator style={styles.loaderWrap} size="large" color={branding.primaryColor} />
      ) : (
        <MarksCard marks={dashboard.marks} />
      )}
    </ScrollView>
  );
}
