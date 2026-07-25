import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsTeacherWorkload } from '@/hooks/useOperationsTeacherWorkload';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

const CLASSIFICATION_COLOR: Record<string, string> = {
  OVERLOADED: '#b91c1c',
  NORMAL: '#4b5563',
  LIGHT_LOAD: '#a16207',
  NO_LECTURE: '#4b5563',
};

export default function OperationsWorkloadScreen() {
  const { role } = useAuth();
  const workload = useOperationsTeacherWorkload();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const rows = workload.data?.rows ?? [];

  return (
    <ScrollView style={styles.teacherScreen} refreshControl={<RefreshControl refreshing={workload.refreshing} onRefresh={workload.handleRefresh} />}>
      {workload.error ? <Text style={styles.errorBanner}>{workload.error}</Text> : null}
      {workload.loading && !workload.data ? <ActivityIndicator color={tc.primary} /> : null}

      {workload.data ? (
        <View style={styles.teacherCard}>
          <View style={styles.grid}>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.error }]}>{workload.data.summary.overloaded}</Text>
              <Text style={styles.teacherLabelCaps}>Overloaded</Text>
            </View>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{workload.data.summary.normal}</Text>
              <Text style={styles.teacherLabelCaps}>Normal</Text>
            </View>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{workload.data.summary.lightLoad}</Text>
              <Text style={styles.teacherLabelCaps}>Light Load</Text>
            </View>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{workload.data.summary.noLecture}</Text>
              <Text style={styles.teacherLabelCaps}>No Lecture</Text>
            </View>
          </View>
        </View>
      ) : null}

      {rows.map((row, index) => (
        <View key={row.teacherId} style={[styles.teacherCard, index === rows.length - 1 && styles.teacherLastCard]}>
          <View style={styles.teacherCardHeaderRow}>
            <Text style={styles.teacherListRowTitle}>{row.teacherName}</Text>
            <Text style={[styles.teacherPill, styles.teacherPillMuted, { color: CLASSIFICATION_COLOR[row.classification] }]}>{row.classification.replace('_', ' ')}</Text>
          </View>
          <Text style={styles.teacherListRowSubtext}>
            {row.effectivePeriods} effective period(s) · {row.freePeriods} free · longest run {row.longestConsecutiveRun}
          </Text>
          {row.warnings.length > 0 ? <Text style={styles.errorText}>{row.warnings.join(', ')}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}
