import React, { useMemo, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsTeacherStatus } from '@/hooks/useOperationsTeacherStatus';
import { useTeacherProfile } from '@/hooks/useTeacherProfile';
import { isSelfOperationsTarget } from '@/lib/operations-self-protection';
import { styles } from '@/lib/styles';
import type { OperationsBaseAttendanceStatus } from '@/lib/types';

const FILTERS: { key: OperationsBaseAttendanceStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PRESENT', label: 'Present' },
  { key: 'ABSENT', label: 'Absent' },
  { key: 'ON_LEAVE', label: 'On Leave' },
  { key: 'NOT_MARKED', label: 'Not Marked' },
];

export default function OperationsTeacherStatusScreen() {
  const { role, branding } = useAuth();
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
      style={styles.container}
      refreshControl={<RefreshControl refreshing={teacherStatus.refreshing} onRefresh={teacherStatus.handleRefresh} />}
    >
      {teacherStatus.error ? <Text style={styles.errorBanner}>{teacherStatus.error}</Text> : null}
      {teacherStatus.loading && !teacherStatus.data ? <ActivityIndicator color={branding.primaryColor} /> : null}

      {teacherStatus.data ? (
        <View style={styles.card}>
          <View style={styles.grid}>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{teacherStatus.data.summary.present}</Text>
              <Text style={styles.overviewLabel}>Present</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{teacherStatus.data.summary.absent}</Text>
              <Text style={styles.overviewLabel}>Absent</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{teacherStatus.data.summary.onLeave}</Text>
              <Text style={styles.overviewLabel}>On Leave</Text>
            </View>
            <View style={styles.overviewTile}>
              <Text style={[styles.overviewNumber, { color: branding.primaryColor }]}>{teacherStatus.data.summary.notMarked}</Text>
              <Text style={styles.overviewLabel}>Not Marked</Text>
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
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>No teachers match this filter.</Text>
        </View>
      ) : null}

      {rows.map((row, index) => {
        const isSelf = isSelfOperationsTarget(row.teacherId, myTeacherId);
        return (
          <View key={row.teacherId} style={[styles.card, index === rows.length - 1 && styles.lastCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.listRowTitle}>
                {row.teacherName}
                {isSelf ? ' (You)' : ''}
              </Text>
              <Text style={styles.statusPill}>{row.baseStatus.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.listRowSubtext}>
              {row.operationalStatus === 'IN_CLASS' && row.currentAssignment
                ? `In class · ${row.currentAssignment.className}-${row.currentAssignment.sectionName}`
                : row.operationalStatus.replace('_', ' ')}
              {' · '}
              {row.todayCoveredPeriods}/{row.todayScheduledPeriods} periods covered
            </Text>
            {!isSelf && row.baseStatus !== 'ON_LEAVE' ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Pressable
                  style={styles.smallButton}
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
                  style={styles.smallButton}
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
