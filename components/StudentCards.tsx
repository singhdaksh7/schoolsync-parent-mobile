import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import { formatDate, formatDateTime, formatStatus } from '@/lib/format';
import type { AttendanceItem, HomeworkItem, StudentAttendanceSummary, TimetableItem } from '@/lib/types';
import { InfoRow } from './InfoRow';
import { EmptyState } from './EmptyState';

export function StudentAttendanceCard({
  attendance,
  summary,
  color,
}: {
  attendance: AttendanceItem[];
  summary: StudentAttendanceSummary | null;
  color: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.sectionTitle}>Attendance Summary</Text>
        {summary ? <Text style={[styles.attendancePct, { color }]}>{summary.percentage}%</Text> : null}
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Present: {summary?.present ?? 0}</Text>
        <Text style={styles.summaryText}>Absent: {summary?.absent ?? 0}</Text>
        <Text style={styles.summaryText}>Late: {summary?.late ?? 0}</Text>
      </View>
      {attendance.slice(0, 8).map((item) => (
        <InfoRow key={item.id} title={formatDate(item.date)} value={formatStatus(item.status)} />
      ))}
      {attendance.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title="No attendance records" message="Records from the last 30 days will appear here." />
      ) : null}
    </View>
  );
}

export function StudentHomeworkCard({ homework }: { homework: HomeworkItem[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Homework</Text>
      {homework.slice(0, 8).map((item) => (
        <View key={item.id} style={styles.homeworkRow}>
          <View style={styles.listRowLeft}>
            <Text style={styles.listRowTitle}>{item.title}</Text>
            <Text style={styles.listRowSubtext}>{item.subject} · Deadline {formatDateTime(item.deadlineAt)}</Text>
            {item.teacherRemark ? <Text style={styles.remarkText}>Remark: {item.teacherRemark}</Text> : null}
          </View>
          <View style={styles.homeworkMeta}>
            <Text style={styles.statusPill}>{formatStatus(item.submissionStatus)}</Text>
            <Text style={styles.methodPill}>{item.submissionMethod}</Text>
            {item.score !== null && item.maxScore !== null ? (
              <Text style={styles.listRowValue}>{item.score}/{item.maxScore}</Text>
            ) : null}
          </View>
        </View>
      ))}
      {homework.length === 0 ? (
        <EmptyState icon="book-outline" title="No homework assigned" message="New assignments will show up here." />
      ) : null}
    </View>
  );
}

export function StudentTodayTimetableCard({ timetable, color }: { timetable: TimetableItem[]; color: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Today&apos;s Timetable</Text>
      {timetable.map((slot) => (
        <View key={slot.id} style={styles.teacherListItem}>
          <View style={[styles.periodBadge, { borderColor: color }]}>
            <Text style={[styles.periodBadgeText, { color }]}>P{slot.period}</Text>
          </View>
          <View style={styles.teacherListBody}>
            <Text style={styles.listRowTitle}>{slot.subject || 'Subject TBD'}</Text>
            <Text style={styles.listRowSubtext}>{slot.teacher?.name || 'Teacher not assigned'}</Text>
          </View>
        </View>
      ))}
      {timetable.length === 0 ? (
        <EmptyState icon="time-outline" title="No periods today" message="Check back tomorrow for your schedule." />
      ) : null}
    </View>
  );
}
