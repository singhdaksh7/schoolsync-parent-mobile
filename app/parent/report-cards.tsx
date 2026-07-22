import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { ReportCardsCard } from '@/components/ReportCardsCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { CardSkeleton } from '@/components/Skeleton';
import { styles } from '@/lib/styles';

export default function ParentReportCardsScreen() {
  const { role, branding, token } = useAuth();
  const dashboard = useParentDashboard();
  const router = useRouter();

  if (role !== 'PARENT') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
    >
      <SubScreenHeader title="Report Cards" color={branding.primaryColor} onBack={() => router.back()} />
      {dashboard.loadingData && dashboard.reportCards.length === 0 ? (
        <CardSkeleton rows={4} />
      ) : (
        <ReportCardsCard reportCards={dashboard.reportCards} token={token} pdfPathPrefix="/api/parent/report-cards" />
      )}
    </ScrollView>
  );
}
