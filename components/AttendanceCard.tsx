import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import { formatDate } from '@/lib/format';
import type { AttendanceItem } from '@/lib/types';
import { InfoRow } from './InfoRow';
import { EmptyState } from './EmptyState';

export function AttendanceCard({
  attendance,
  summary,
}: {
  attendance: AttendanceItem[];
  summary: { present: number; absent: number; late: number };
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Attendance</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Present: {summary.present}</Text>
        <Text style={styles.summaryText}>Absent: {summary.absent}</Text>
        <Text style={styles.summaryText}>Late: {summary.late}</Text>
      </View>
      {attendance.slice(0, 8).map((item) => (
        <InfoRow key={item.id} title={formatDate(item.date)} value={item.status} />
      ))}
      {attendance.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title="No attendance records" message="Attendance records will appear here." />
      ) : null}
    </View>
  );
}
