import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { AnnouncementsCard } from '@/components/AnnouncementsCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { CardSkeleton } from '@/components/Skeleton';
import { styles } from '@/lib/styles';

export default function ParentAnnouncementsScreen() {
  const { role, branding } = useAuth();
  const dashboard = useParentDashboard();
  const router = useRouter();

  if (role !== 'PARENT') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
    >
      <SubScreenHeader title="Announcements" color={branding.primaryColor} onBack={() => router.back()} />
      {dashboard.loadingData && dashboard.announcements.length === 0 ? (
        <CardSkeleton rows={3} />
      ) : (
        <AnnouncementsCard announcements={dashboard.announcements} />
      )}
    </ScrollView>
  );
}
