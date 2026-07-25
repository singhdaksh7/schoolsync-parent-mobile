import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsCurrentPeriod } from '@/hooks/useOperationsCurrentPeriod';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

export default function OperationsCurrentPeriodScreen() {
  const { role } = useAuth();
  const currentPeriod = useOperationsCurrentPeriod();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const data = currentPeriod.data;

  return (
    <ScrollView
      style={styles.teacherScreen}
      refreshControl={<RefreshControl refreshing={currentPeriod.refreshing} onRefresh={currentPeriod.handleRefresh} />}
    >
      {currentPeriod.error ? <Text style={styles.errorBanner}>{currentPeriod.error}</Text> : null}
      {currentPeriod.loading && !data ? <ActivityIndicator color={tc.primary} /> : null}

      {data && !data.periodNumber ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>No period is currently in session.</Text>
        </View>
      ) : null}

      {data?.periodNumber ? (
        <>
          <View style={styles.teacherCard}>
            <Text style={styles.teacherSectionTitle}>Period {data.periodNumber}{data.label ? ` · ${data.label}` : ''}</Text>
            <View style={styles.grid}>
              <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
                <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{data.runningClasses}</Text>
                <Text style={styles.teacherLabelCaps}>Classes Running</Text>
              </View>
              <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
                <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{data.normal + data.substituted}</Text>
                <Text style={styles.teacherLabelCaps}>Covered</Text>
              </View>
              <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
                <Text style={[styles.teacherStatValue, { color: tc.error }]}>{data.uncovered}</Text>
                <Text style={styles.teacherLabelCaps}>Uncovered</Text>
              </View>
              <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
                <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{data.teachersInClass}</Text>
                <Text style={styles.teacherLabelCaps}>Teachers In Class</Text>
              </View>
              <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
                <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{data.teachersFree}</Text>
                <Text style={styles.teacherLabelCaps}>Teachers Free</Text>
              </View>
              <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
                <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{data.teachersUnavailable}</Text>
                <Text style={styles.teacherLabelCaps}>Unavailable</Text>
              </View>
            </View>
          </View>

          {data.uncoveredDetails.length > 0 ? (
            <View style={[styles.teacherCard, styles.teacherLastCard]}>
              <Text style={styles.teacherSectionTitle}>Uncovered Right Now</Text>
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
