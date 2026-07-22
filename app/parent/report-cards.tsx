import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { ReportCardsCard } from '@/components/ReportCardsCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
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
        <ActivityIndicator style={styles.loaderWrap} size="large" color={branding.primaryColor} />
      ) : (
        <ReportCardsCard reportCards={dashboard.reportCards} token={token} pdfPathPrefix="/api/parent/report-cards" />
      )}
    </ScrollView>
  );
}
