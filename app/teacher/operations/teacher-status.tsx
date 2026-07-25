import React, { useMemo, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsTeacherStatus } from '@/hooks/useOperationsTeacherStatus';
import { useTeacherProfile } from '@/hooks/useTeacherProfile';
import { isSelfOperationsTarget } from '@/lib/operations-self-protection';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';
import type { OperationsBaseAttendanceStatus } from '@/lib/types';

const tc = TeacherTheme.colors;

const FILTERS: { key: OperationsBaseAttendanceStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PRESENT', label: 'Present' },
  { key: 'ABSENT', label: 'Absent' },
  { key: 'ON_LEAVE', label: 'On Leave' },
  { key: 'NOT_MARKED', label: 'Not Marked' },
];

export default function OperationsTeacherStatusScreen() {
  const { role } = useAuth();
  const teacherStatus = useOperationsTeacherStatus();
  const profile = useTeacherProfile();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('ALL');
  const rows = useMemo(() => {
    const all = teacherStatus.data?.data ?? [];
    if (filter === 'ALL') return all;
    return all.filter((row) => row.baseStatus === filter || row.operationalStatus === filter);
  }, [teacherStatus.data, filter]);

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const myTeacherId = profile.profile?.id;

  return (
    <ScrollView
      style={styles.teacherScreen}
      refreshControl={<RefreshControl refreshing={teacherStatus.refreshing} onRefresh={teacherStatus.handleRefresh} />}
    >
      {teacherStatus.error ? <Text style={styles.errorBanner}>{teacherStatus.error}</Text> : null}
      {teacherStatus.loading && !teacherStatus.data ? <ActivityIndicator color={tc.primary} /> : null}

      {teacherStatus.data ? (
        <View style={styles.teacherCard}>
          <View style={styles.grid}>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{teacherStatus.data.summary.present}</Text>
              <Text style={styles.teacherLabelCaps}>Present</Text>
            </View>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{teacherStatus.data.summary.absent}</Text>
              <Text style={styles.teacherLabelCaps}>Absent</Text>
            </View>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{teacherStatus.data.summary.onLeave}</Text>
              <Text style={styles.teacherLabelCaps}>On Leave</Text>
            </View>
            <View style={[styles.overviewTile, { backgroundColor: tc.surfaceContainerLow, borderColor: tc.cardBorder }]}>
              <Text style={[styles.teacherStatValue, { color: tc.primary }]}>{teacherStatus.data.summary.notMarked}</Text>
              <Text style={styles.teacherLabelCaps}>Not Marked</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.segmented}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} style={styles.segment} onPress={() => setFilter(f.key)}>
            <Text style={f.key === filter ? styles.segmentTextActive : styles.segmentText}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {rows.length === 0 && !teacherStatus.loading ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>No teachers match this filter.</Text>
        </View>
      ) : null}

      {rows.map((row, index) => {
        const isSelf = isSelfOperationsTarget(row.teacherId, myTeacherId);
        return (
          <View key={row.teacherId} style={[styles.teacherCard, index === rows.length - 1 && styles.teacherLastCard]}>
            <View style={styles.teacherCardHeaderRow}>
              <Text style={styles.teacherListRowTitle}>
                {row.teacherName}
                {isSelf ? ' (You)' : ''}
              </Text>
              <Text style={[styles.teacherPill, styles.teacherPillMuted]}>{row.baseStatus.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.teacherListRowSubtext}>
              {row.operationalStatus === 'IN_CLASS' && row.currentAssignment
                ? `In class · ${row.currentAssignment.className}-${row.currentAssignment.sectionName}`
                : row.operationalStatus.replace('_', ' ')}
              {' · '}
              {row.todayCoveredPeriods}/{row.todayScheduledPeriods} periods covered
            </Text>
            {!isSelf && row.baseStatus !== 'ON_LEAVE' ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Pressable
                  style={[styles.smallButton, { backgroundColor: tc.secondary }]}
                  onPress={() => teacherStatus.setStatus(row.teacherId, 'PRESENT')}
                  disabled={teacherStatus.updatingId === row.teacherId}
                >
                  {teacherStatus.updatingId === row.teacherId ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.smallButtonText}>Mark Present</Text>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.smallButton, { backgroundColor: tc.secondary }]}
                  onPress={() => teacherStatus.setStatus(row.teacherId, 'ABSENT')}
                  disabled={teacherStatus.updatingId === row.teacherId}
                >
                  {teacherStatus.updatingId === row.teacherId ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.smallButtonText}>Mark Absent</Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
