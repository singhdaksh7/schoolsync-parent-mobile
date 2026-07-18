import React, { useMemo } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { ActorHeader } from '@/components/BrandHeader';
import { OperationsBanner } from '@/components/OperationsBanner';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useTeacherArrangements } from '@/hooks/useTeacherArrangements';
import { useTeacherEarlyLeave } from '@/hooks/useTeacherEarlyLeave';
import { useTeacherFullLeave } from '@/hooks/useTeacherFullLeave';
import { useTeacherHomework } from '@/hooks/useTeacherHomework';
import { useTeacherOperationsSelfStatus } from '@/hooks/useTeacherOperationsSelfStatus';
import { useTeacherSchedule } from '@/hooks/useTeacherSchedule';
import { useTeacherSelfAttendance } from '@/hooks/useTeacherSelfAttendance';
import { classSectionLabel, formatDate, formatStatus, roleLabel } from '@/lib/format';
import { styles } from '@/lib/styles';

function todayBackendDayOfWeek() {
  const jsDay = new Date().getDay(); // 0 = Sun .. 6 = Sat
  return jsDay === 0 ? 7 : jsDay;
}

export default function TeacherHomeScreen() {
  const { role, user, branding, logout } = useAuth();
  const router = useRouter();
  const { hasFeature } = useFeatureBootstrap();
  const attendance = useTeacherSelfAttendance();
  const schedule = useTeacherSchedule();
  const homework = useTeacherHomework();
  const earlyLeave = useTeacherEarlyLeave();
  const fullLeave = useTeacherFullLeave();
  const arrangements = useTeacherArrangements();
  const opsStatus = useTeacherOperationsSelfStatus();
  const today = todayBackendDayOfWeek();
  const todaySlots = useMemo(
    () => schedule.slots.filter((slot) => slot.dayOfWeek === today).sort((a, b) => a.period - b.period),
    [schedule.slots, today]
  );

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const activeHomeworkCount = homework.homework.filter((item) => item.status === 'ACTIVE').length;
  const latestEarlyLeave = earlyLeave.requests[0];
  const latestFullLeave = fullLeave.leaves[0];
  const attendanceEnabled = hasFeature('ATTENDANCE');
  const homeworkEnabled = hasFeature('HOMEWORK');

  const refreshing =
    attendance.refreshing || schedule.refreshing || homework.refreshing || earlyLeave.refreshing || fullLeave.refreshing || arrangements.refreshing;
  const handleRefresh = () => {
    attendance.handleRefresh();
    schedule.handleRefresh();
    homework.handleRefresh();
    earlyLeave.handleRefresh();
    fullLeave.handleRefresh();
    arrangements.handleRefresh();
    opsStatus.refresh();
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <ActorHeader branding={branding} userName={user?.name || ''} roleLabel={roleLabel(role)} onLogout={logout} />

      <OperationsBanner status={opsStatus.data} />

      {opsStatus.data?.isEffectiveOperationsHead ? (
        <Pressable style={styles.card} onPress={() => router.push('/teacher/operations')}>
          <Text style={styles.sectionTitle}>Manage Operations</Text>
          <Text style={styles.listRowSubtext}>Today, coverage, teacher status, and leave decisions for the school.</Text>
        </Pressable>
      ) : null}

      {attendanceEnabled ? (
        <View style={[styles.card, styles.attendanceCard]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Today&apos;s Attendance</Text>
              <Text style={styles.listRowSubtext}>{formatDate(new Date().toISOString())}</Text>
            </View>
            {attendance.loading ? <ActivityIndicator color={branding.primaryColor} /> : null}
          </View>
          {attendance.error ? <Text style={styles.inlineErrorText}>{attendance.error}</Text> : null}
          <Text style={styles.emptyText}>
            Status: {formatStatus(attendance.attendance?.status || attendance.attendance?.attendance?.status || 'Not marked')}
          </Text>
          {!attendance.attendance?.attendance && attendance.attendance?.canMarkPresent ? (
            <Pressable
              style={[styles.primaryButton, { backgroundColor: branding.primaryColor }, attendance.marking && styles.primaryButtonDisabled]}
              onPress={attendance.markPresent}
              disabled={attendance.marking}
            >
              {attendance.marking ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Mark Present</Text>}
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
        {todaySlots.map((slot, index) => (
          <View key={`${slot.period}-${index}`} style={styles.teacherListItem}>
            <View style={[styles.periodBadge, { borderColor: branding.primaryColor }]}>
              <Text style={[styles.periodBadgeText, { color: branding.primaryColor }]}>P{slot.period}</Text>
            </View>
            <View style={styles.teacherListBody}>
              <Text style={styles.listRowTitle}>{slot.subject || 'Subject TBD'}</Text>
              <Text style={styles.listRowSubtext}>
                {slot.className}-{slot.sectionName}
              </Text>
            </View>
          </View>
        ))}
        {todaySlots.length === 0 ? <Text style={styles.emptyText}>No periods scheduled for today.</Text> : null}
      </View>

      {homeworkEnabled ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Homework</Text>
          <Text style={styles.emptyText}>{activeHomeworkCount} active assignment{activeHomeworkCount === 1 ? '' : 's'}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Early Leave</Text>
        {latestEarlyLeave ? (
          <Text style={styles.emptyText}>
            Latest: {formatDate(latestEarlyLeave.date)} — after P{latestEarlyLeave.leaveAfterPeriod} — {formatStatus(latestEarlyLeave.status)}
          </Text>
        ) : (
          <Text style={styles.emptyText}>No early-leave requests.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Full Leave</Text>
        {latestFullLeave ? (
          <Text style={styles.emptyText}>
            Latest: {formatDate(latestFullLeave.fromDate)} – {formatDate(latestFullLeave.toDate)} — {formatStatus(latestFullLeave.status)}
          </Text>
        ) : (
          <Text style={styles.emptyText}>No full-leave requests.</Text>
        )}
      </View>

      <View style={[styles.card, styles.lastCard]}>
        <Text style={styles.sectionTitle}>Substitutions</Text>
        {arrangements.arrangements.slice(0, 3).map((item) => (
          <View key={item.id} style={styles.teacherListItem}>
            <View style={styles.teacherListBody}>
              <Text style={styles.listRowTitle}>{item.subject || 'Substitution'}</Text>
              <Text style={styles.listRowSubtext}>
                {classSectionLabel(item.section)}
                {item.date ? ` · ${formatDate(item.date)}` : ''}
              </Text>
            </View>
          </View>
        ))}
        {arrangements.arrangements.length === 0 ? <Text style={styles.emptyText}>No substitutions assigned.</Text> : null}
      </View>
    </ScrollView>
  );
}
