import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsNextPeriodRisk } from '@/hooks/useOperationsNextPeriodRisk';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

const RISK_COLOR: Record<string, string> = {
  NONE: '#15803d',
  LOW: '#4b5563',
  MEDIUM: '#a16207',
  HIGH: '#c2410c',
  CRITICAL: '#b91c1c',
};

export default function OperationsNextPeriodScreen() {
  const { role } = useAuth();
  const nextPeriod = useOperationsNextPeriodRisk();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const data = nextPeriod.data;

  return (
    <ScrollView
      style={styles.teacherScreen}
      refreshControl={<RefreshControl refreshing={nextPeriod.refreshing} onRefresh={nextPeriod.handleRefresh} />}
    >
      {nextPeriod.error ? <Text style={styles.errorBanner}>{nextPeriod.error}</Text> : null}
      {nextPeriod.loading && !data ? <ActivityIndicator color={tc.primary} /> : null}

      {data && !data.hasNextPeriod ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>No further periods scheduled today.</Text>
        </View>
      ) : null}

      {data?.hasNextPeriod ? (
        <>
          <View style={styles.teacherCard}>
            <View style={styles.teacherCardHeaderRow}>
              <Text style={styles.teacherSectionTitle}>
                Period {data.periodNumber}
                {data.label ? ` · ${data.label}` : ''}
              </Text>
              <Text style={[styles.teacherPill, styles.teacherPillMuted, { color: RISK_COLOR[data.riskLevel] }]}>{data.riskLevel}</Text>
            </View>
            <Text style={styles.teacherListRowSubtext}>
              Starts {data.startsInMinutes !== null ? `in ${data.startsInMinutes} min` : `at ${data.startTime ?? '--'}`}
            </Text>
            <View style={styles.grid}>
              <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
                <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{data.scheduled}</Text>
                <Text style={styles.teacherLabelCaps}>Scheduled</Text>
              </View>
              <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
                <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{data.covered}</Text>
                <Text style={styles.teacherLabelCaps}>Substituted</Text>
              </View>
              <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
                <Text style={[styles.teacherStatValue, { color: tc.error }]}>{data.uncovered}</Text>
                <Text style={styles.teacherLabelCaps}>Uncovered</Text>
              </View>
            </View>
          </View>

          {data.uncoveredDetails.length > 0 ? (
            <View style={[styles.teacherCard, styles.teacherLastCard]}>
              <Text style={styles.teacherSectionTitle}>At Risk</Text>
              {data.uncoveredDetails.map((detail, index) => (
                <View key={`${detail.period}-${detail.sectionName}-${index}`} style={styles.teacherListRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teacherListRowTitle}>
                      {detail.className}-{detail.sectionName} · {detail.subject ?? 'Unassigned'}
                    </Text>
                    <Text style={styles.teacherListRowSubtext}>
                      {detail.originalTeacherName ? `${detail.originalTeacherName} ` : ''}
                      {detail.unavailabilityReason === 'ABSENT' ? 'Absent' : detail.unavailabilityReason === 'ON_LEAVE' ? 'On leave' : 'Unassigned'}
                      {detail.topRecommendations.length > 0 ? ` · Try: ${detail.topRecommendations.map((r) => r.teacherName).join(', ')}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}
