import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsLectureCoverage } from '@/hooks/useOperationsLectureCoverage';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

export default function OperationsUncoveredLecturesScreen() {
  const { role } = useAuth();
  const coverage = useOperationsLectureCoverage();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const details = coverage.data?.uncoveredDetails ?? [];

  return (
    <ScrollView style={styles.teacherScreen} refreshControl={<RefreshControl refreshing={coverage.refreshing} onRefresh={coverage.handleRefresh} />}>
      {coverage.error ? <Text style={styles.errorBanner}>{coverage.error}</Text> : null}
      {coverage.loading && !coverage.data ? <ActivityIndicator color={tc.primary} /> : null}

      {coverage.data ? (
        <View style={styles.teacherCard}>
          <View style={styles.grid}>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{coverage.data.totals.scheduled}</Text>
              <Text style={styles.teacherLabelCaps}>Scheduled</Text>
            </View>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{coverage.data.totals.normal}</Text>
              <Text style={styles.teacherLabelCaps}>Normal</Text>
            </View>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{coverage.data.totals.substituted}</Text>
              <Text style={styles.teacherLabelCaps}>Substituted</Text>
            </View>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.error }]}>{coverage.data.totals.uncovered}</Text>
              <Text style={styles.teacherLabelCaps}>Uncovered</Text>
            </View>
          </View>
        </View>
      ) : null}

      {details.length === 0 && !coverage.loading ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>No uncovered lectures today.</Text>
        </View>
      ) : null}

      {details.map((detail, index) => (
        <View key={`${detail.period}-${detail.sectionName}-${index}`} style={[styles.teacherCard, index === details.length - 1 && styles.teacherLastCard]}>
          <Text style={styles.teacherListRowTitle}>
            Period {detail.period} · {detail.className}-{detail.sectionName}
          </Text>
          <Text style={styles.teacherListRowSubtext}>
            {detail.subject ?? 'Unassigned'}
            {detail.originalTeacherName ? ` · ${detail.originalTeacherName}` : ''}
            {detail.unavailabilityReason === 'ABSENT' ? ' (Absent)' : detail.unavailabilityReason === 'ON_LEAVE' ? ' (On leave)' : ''}
          </Text>
          {detail.topRecommendations.length > 0 ? (
            <Text style={styles.teacherMeta}>Suggested: {detail.topRecommendations.map((r) => r.teacherName).join(', ')}</Text>
          ) : (
            <Text style={styles.teacherMeta}>No available substitute recommendations.</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
