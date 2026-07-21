import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsToday } from '@/hooks/useOperationsToday';
import { useOperationsAttention } from '@/hooks/useOperationsAttention';
import { styles } from '@/lib/styles';

const HEALTH_LABEL: Record<string, string> = {
  HEALTHY: 'Healthy',
  GOOD: 'Good',
  NEEDS_ATTENTION: 'Needs Attention',
  CRITICAL: 'Critical',
};

const NAV_TILES = [
  { key: 'teacher-status', title: 'Teacher Status', description: 'Who is present, absent, on leave, in class, or free right now.' },
  { key: 'leaves', title: 'Leave Management', description: 'Review and decide pending teacher leave requests.' },
  { key: 'uncovered-lectures', title: 'Uncovered Lectures', description: "Today's coverage gaps with substitute recommendations." },
  { key: 'workload', title: 'Teacher Workload', description: "Today's teaching-load balance across the school." },
  { key: 'activity', title: 'Activity', description: 'A timeline of operational actions taken today.' },
] as const;

/**
 * Today hub — the single restrained entry point into the Teacher Operations
 * Command Center on mobile. Reachable only while this Teacher is the
 * effective Operations Head; the backend enforces that on every request
 * regardless of what this screen shows.
 */
export default function TeacherOperationsHubScreen() {
  const { role, branding } = useAuth();
  const router = useRouter();
  const today = useOperationsToday();
  const attention = useOperationsAttention();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const refreshing = today.refreshing || attention.refreshing;
  const handleRefresh = () => {
    today.handleRefresh();
    attention.handleRefresh();
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <View style={[styles.header, { backgroundColor: branding.primaryColor }]}>
        <Text style={styles.title}>Today at School</Text>
      </View>

      {today.error ? <Text style={styles.errorBanner}>{today.error}</Text> : null}
      {today.loading && !today.data ? <ActivityIndicator color={branding.primaryColor} /> : null}

      {today.data ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.grid}>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{today.data.teacherSummary.present}</Text>
              <Text style={styles.overviewLabel}>Present</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{today.data.teacherSummary.absent}</Text>
              <Text style={styles.overviewLabel}>Absent</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{today.data.teacherSummary.onLeave}</Text>
              <Text style={styles.overviewLabel}>On Leave</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{today.data.teacherSummary.notMarked}</Text>
              <Text style={styles.overviewLabel}>Not Marked</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{today.data.coverage.coveragePercentage ?? '--'}%</Text>
              <Text style={styles.overviewLabel}>Coverage</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{today.data.studentAttendance.attendancePercentage ?? '--'}%</Text>
              <Text style={styles.overviewLabel}>Student Attendance</Text>
            </View>
          </View>
        </View>
      ) : null}

      <Pressable style={styles.card} onPress={() => router.push('/teacher/operations/attention')}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Needs Attention</Text>
          {attention.data ? <Text style={styles.statusPill}>{HEALTH_LABEL[attention.data.health.status] ?? attention.data.health.status}</Text> : null}
        </View>
        {attention.error ? <Text style={styles.errorText}>{attention.error}</Text> : null}
        {attention.data && attention.data.attention.length === 0 ? <Text style={styles.emptyText}>Nothing needs attention right now.</Text> : null}
        {attention.data?.attention.slice(0, 3).map((item) => (
          <View key={item.code} style={styles.listRow}>
            <View style={styles.listRowLeft}>
              <Text style={styles.listRowTitle}>{item.title}</Text>
              <Text style={styles.listRowSubtext}>{item.description}</Text>
            </View>
          </View>
        ))}
        {attention.data && attention.data.attention.length > 3 ? (
          <Text style={styles.listRowSubtext}>+{attention.data.attention.length - 3} more</Text>
        ) : null}
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push('/teacher/operations/current-period')}>
        <Text style={styles.sectionTitle}>Current Period</Text>
        {today.data?.currentPeriod.periodNumber ? (
          <Text style={styles.listRowSubtext}>
            Period {today.data.currentPeriod.periodNumber} · {today.data.currentPeriod.normal + today.data.currentPeriod.substituted}/
            {today.data.currentPeriod.runningClasses} covered
            {today.data.currentPeriod.uncovered > 0 ? ` · ${today.data.currentPeriod.uncovered} uncovered` : ''}
          </Text>
        ) : (
          <Text style={styles.emptyText}>No period is currently in session.</Text>
        )}
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push('/teacher/operations/next-period')}>
        <Text style={styles.sectionTitle}>Next Period</Text>
        {today.data?.nextPeriodRisk.hasNextPeriod ? (
          <Text style={styles.listRowSubtext}>
            Period {today.data.nextPeriodRisk.periodNumber} in {today.data.nextPeriodRisk.startsInMinutes ?? '?'} min ·{' '}
            {today.data.nextPeriodRisk.riskLevel === 'NONE' ? 'No risk' : `Risk: ${today.data.nextPeriodRisk.riskLevel}`}
          </Text>
        ) : (
          <Text style={styles.emptyText}>No further periods scheduled today.</Text>
        )}
      </Pressable>

      {NAV_TILES.map((tile, index) => (
        <Pressable
          key={tile.key}
          style={[styles.card, index === NAV_TILES.length - 1 && styles.lastCard]}
          onPress={() => router.push(`/teacher/operations/${tile.key}`)}
        >
          <Text style={styles.sectionTitle}>{tile.title}</Text>
          <Text style={styles.listRowSubtext}>{tile.description}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
