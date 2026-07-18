import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsCurrentPeriod } from '@/hooks/useOperationsCurrentPeriod';
import { styles } from '@/lib/styles';

export default function OperationsCurrentPeriodScreen() {
  const { role, branding } = useAuth();
  const currentPeriod = useOperationsCurrentPeriod();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const data = currentPeriod.data;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={currentPeriod.refreshing} onRefresh={currentPeriod.handleRefresh} />}
    >
      {currentPeriod.error ? <Text style={styles.errorBanner}>{currentPeriod.error}</Text> : null}
      {currentPeriod.loading && !data ? <ActivityIndicator color={branding.primaryColor} /> : null}

      {data && !data.periodNumber ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>No period is currently in session.</Text>
        </View>
      ) : null}

      {data?.periodNumber ? (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Period {data.periodNumber}{data.label ? ` · ${data.label}` : ''}</Text>
            <View style={styles.grid}>
              <View style={styles.overviewTile}>
                <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{data.runningClasses}</Text>
                <Text style={styles.overviewLabel}>Classes Running</Text>
              </View>
              <View style={styles.overviewTile}>
                <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{data.normal + data.substituted}</Text>
                <Text style={styles.overviewLabel}>Covered</Text>
              </View>
              <View style={styles.overviewTile}>
                <Text style={[styles.overviewNumber, { color: '#b91c1c' }]}>{data.uncovered}</Text>
                <Text style={styles.overviewLabel}>Uncovered</Text>
              </View>
              <View style={styles.overviewTile}>
                <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{data.teachersInClass}</Text>
                <Text style={styles.overviewLabel}>Teachers In Class</Text>
              </View>
              <View style={styles.overviewTile}>
                <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{data.teachersFree}</Text>
                <Text style={styles.overviewLabel}>Teachers Free</Text>
              </View>
              <View style={styles.overviewTile}>
                <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{data.teachersUnavailable}</Text>
                <Text style={styles.overviewLabel}>Unavailable</Text>
              </View>
            </View>
          </View>

          {data.uncoveredDetails.length > 0 ? (
            <View style={[styles.card, styles.lastCard]}>
              <Text style={styles.sectionTitle}>Uncovered Right Now</Text>
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
