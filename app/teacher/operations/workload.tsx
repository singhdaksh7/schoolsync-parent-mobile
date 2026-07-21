import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsTeacherWorkload } from '@/hooks/useOperationsTeacherWorkload';
import { styles } from '@/lib/styles';

const CLASSIFICATION_COLOR: Record<string, string> = {
  OVERLOADED: '#b91c1c',
  NORMAL: '#4b5563',
  LIGHT_LOAD: '#a16207',
  NO_LECTURE: '#4b5563',
};

export default function OperationsWorkloadScreen() {
  const { role, branding } = useAuth();
  const workload = useOperationsTeacherWorkload();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const rows = workload.data?.rows ?? [];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={workload.refreshing} onRefresh={workload.handleRefresh} />}>
      {workload.error ? <Text style={styles.errorBanner}>{workload.error}</Text> : null}
      {workload.loading && !workload.data ? <ActivityIndicator color={branding.primaryColor} /> : null}

      {workload.data ? (
        <View style={styles.card}>
          <View style={styles.grid}>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: '#b91c1c' }]}>{workload.data.summary.overloaded}</Text>
              <Text style={styles.overviewLabel}>Overloaded</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{workload.data.summary.normal}</Text>
              <Text style={styles.overviewLabel}>Normal</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{workload.data.summary.lightLoad}</Text>
              <Text style={styles.overviewLabel}>Light Load</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{workload.data.summary.noLecture}</Text>
              <Text style={styles.overviewLabel}>No Lecture</Text>
            </View>
          </View>
        </View>
      ) : null}

      {rows.map((row, index) => (
        <View key={row.teacherId} style={[styles.card, index === rows.length - 1 && styles.lastCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.listRowTitle}>{row.teacherName}</Text>
            <Text style={[styles.statusPill, { color: CLASSIFICATION_COLOR[row.classification] }]}>{row.classification.replace('_', ' ')}</Text>
          </View>
          <Text style={styles.listRowSubtext}>
            {row.effectivePeriods} effective period(s) · {row.freePeriods} free · longest run {row.longestConsecutiveRun}
          </Text>
          {row.warnings.length > 0 ? <Text style={styles.errorText}>{row.warnings.join(', ')}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}
