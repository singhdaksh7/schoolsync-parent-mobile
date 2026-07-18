import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsLectureCoverage } from '@/hooks/useOperationsLectureCoverage';
import { styles } from '@/lib/styles';

export default function OperationsUncoveredLecturesScreen() {
  const { role, branding } = useAuth();
  const coverage = useOperationsLectureCoverage();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const details = coverage.data?.uncoveredDetails ?? [];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={coverage.refreshing} onRefresh={coverage.handleRefresh} />}>
      {coverage.error ? <Text style={styles.errorBanner}>{coverage.error}</Text> : null}
      {coverage.loading && !coverage.data ? <ActivityIndicator color={branding.primaryColor} /> : null}

      {coverage.data ? (
        <View style={styles.card}>
          <View style={styles.grid}>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{coverage.data.totals.scheduled}</Text>
              <Text style={styles.overviewLabel}>Scheduled</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{coverage.data.totals.normal}</Text>
              <Text style={styles.overviewLabel}>Normal</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{coverage.data.totals.substituted}</Text>
              <Text style={styles.overviewLabel}>Substituted</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: '#b91c1c' }]}>{coverage.data.totals.uncovered}</Text>
              <Text style={styles.overviewLabel}>Uncovered</Text>
            </View>
          </View>
        </View>
      ) : null}

      {details.length === 0 && !coverage.loading ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>No uncovered lectures today.</Text>
        </View>
      ) : null}

      {details.map((detail, index) => (
        <View key={`${detail.period}-${detail.sectionName}-${index}`} style={[styles.card, index === details.length - 1 && styles.lastCard]}>
          <Text style={styles.listRowTitle}>
            Period {detail.period} · {detail.className}-{detail.sectionName}
          </Text>
          <Text style={styles.listRowSubtext}>
            {detail.subject ?? 'Unassigned'}
            {detail.originalTeacherName ? ` · ${detail.originalTeacherName}` : ''}
            {detail.unavailabilityReason === 'ABSENT' ? ' (Absent)' : detail.unavailabilityReason === 'ON_LEAVE' ? ' (On leave)' : ''}
          </Text>
          {detail.topRecommendations.length > 0 ? (
            <Text style={styles.remarkText}>Suggested: {detail.topRecommendations.map((r) => r.teacherName).join(', ')}</Text>
          ) : (
            <Text style={styles.remarkText}>No available substitute recommendations.</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
