import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsNextPeriodRisk } from '@/hooks/useOperationsNextPeriodRisk';
import { styles } from '@/lib/styles';

const RISK_COLOR: Record<string, string> = {
  NONE: '#15803d',
  LOW: '#4b5563',
  MEDIUM: '#a16207',
  HIGH: '#c2410c',
  CRITICAL: '#b91c1c',
};

export default function OperationsNextPeriodScreen() {
  const { role, branding } = useAuth();
  const nextPeriod = useOperationsNextPeriodRisk();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const data = nextPeriod.data;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={nextPeriod.refreshing} onRefresh={nextPeriod.handleRefresh} />}
    >
      {nextPeriod.error ? <Text style={styles.errorBanner}>{nextPeriod.error}</Text> : null}
      {nextPeriod.loading && !data ? <ActivityIndicator color={branding.primaryColor} /> : null}

      {data && !data.hasNextPeriod ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>No further periods scheduled today.</Text>
        </View>
      ) : null}

      {data?.hasNextPeriod ? (
        <>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>
                Period {data.periodNumber}
                {data.label ? ` · ${data.label}` : ''}
              </Text>
              <Text style={[styles.statusPill, { color: RISK_COLOR[data.riskLevel] }]}>{data.riskLevel}</Text>
            </View>
            <Text style={styles.listRowSubtext}>
              Starts {data.startsInMinutes !== null ? `in ${data.startsInMinutes} min` : `at ${data.startTime ?? '--'}`}
            </Text>
            <View style={styles.grid}>
              <View style={styles.overviewTile}>
                <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{data.scheduled}</Text>
                <Text style={styles.overviewLabel}>Scheduled</Text>
              </View>
              <View style={styles.overviewTile}>
                <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{data.covered}</Text>
                <Text style={styles.overviewLabel}>Substituted</Text>
              </View>
              <View style={styles.overviewTile}>
                <Text style={[styles.overviewNumber, { color: '#b91c1c' }]}>{data.uncovered}</Text>
                <Text style={styles.overviewLabel}>Uncovered</Text>
              </View>
            </View>
          </View>

          {data.uncoveredDetails.length > 0 ? (
            <View style={[styles.card, styles.lastCard]}>
              <Text style={styles.sectionTitle}>At Risk</Text>
              {data.uncoveredDetails.map((detail, index) => (
                <View key={`${detail.period}-${detail.sectionName}-${index}`} style={styles.listRow}>
                  <View style={styles.listRowLeft}>
                    <Text style={styles.listRowTitle}>
                      {detail.className}-{detail.sectionName} · {detail.subject ?? 'Unassigned'}
                    </Text>
                    <Text style={styles.listRowSubtext}>
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
