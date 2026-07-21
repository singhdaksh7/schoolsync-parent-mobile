import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { ReportCardsCard } from '@/components/ReportCardsCard';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { styles } from '@/lib/styles';

// Reference-design label was "Provisional Result" — SchoolSync has no
// provisional/revaluation result concept, only published Report Cards, so
// this tile is renamed to match. See lib/student-portal-modules.ts.
export default function StudentReportCardsScreen() {
  const { role, branding, token } = useAuth();
  const dashboard = useStudentDashboard();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
    >
      <SubScreenHeader title="Report Cards" color={branding.primaryColor} onBack={() => router.back()} />
      {dashboard.loading && dashboard.reportCards.length === 0 ? (
        <ActivityIndicator style={styles.loaderWrap} size="large" color={branding.primaryColor} />
      ) : (
        <ReportCardsCard reportCards={dashboard.reportCards} token={token} pdfPathPrefix="/api/student/report-cards" />
      )}
    </ScrollView>
  );
}
