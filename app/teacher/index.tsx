import React, { useMemo } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { PortalGrid } from '@/components/PortalGrid';
import { OperationsBanner } from '@/components/OperationsBanner';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useTeacherEarlyLeave } from '@/hooks/useTeacherEarlyLeave';
import { useTeacherFullLeave } from '@/hooks/useTeacherFullLeave';
import { useTeacherHomework } from '@/hooks/useTeacherHomework';
import { useTeacherOperationsSelfStatus } from '@/hooks/useTeacherOperationsSelfStatus';
import { useTeacherSchedule } from '@/hooks/useTeacherSchedule';
import { useTeacherSelfAttendance } from '@/hooks/useTeacherSelfAttendance';
import { computeVisibleTeacherPortalModules } from '@/lib/teacher-portal-modules';
import { formatDate, formatStatus } from '@/lib/format';
import { EmptyState } from '@/components/EmptyState';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

function todayBackendDayOfWeek() {
  const jsDay = new Date().getDay(); // 0 = Sun .. 6 = Sat
  return jsDay === 0 ? 7 : jsDay;
}

// Grid-menu landing screen for the Teacher Portal ("Home" tab) — mirrors the
// Student/Parent Portal grid via the shared PortalGrid component. Schedule/
// Attendance/Work/Profile also remain reachable via the tab bar (unchanged);
// the grid adds Substitutions and (conditionally) Operations, which have no
// tab of their own. See lib/teacher-portal-modules.ts for the (unit-tested)
// visibility rule.
//
// Today's Attendance (with its Mark Present action), Today's Schedule,
// active-homework count, and latest Early/Full Leave status are folded in
// here as a compact "at a glance" strip — they were on the old Home
// dashboard and have no grid tile of their own to relocate to.
export default function TeacherHomeScreen() {
  const { role, user, logout } = useAuth();
  const router = useRouter();
  const { hasFeature } = useFeatureBootstrap();
  const attendance = useTeacherSelfAttendance();
  const schedule = useTeacherSchedule();
  const homework = useTeacherHomework();
  const earlyLeave = useTeacherEarlyLeave();
  const fullLeave = useTeacherFullLeave();
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

  const modules = computeVisibleTeacherPortalModules(hasFeature, opsStatus.data?.isEffectiveOperationsHead ?? false);

  const refreshing = attendance.refreshing || schedule.refreshing || homework.refreshing || earlyLeave.refreshing || fullLeave.refreshing;
  const handleRefresh = () => {
    attendance.handleRefresh();
    schedule.handleRefresh();
    homework.handleRefresh();
    earlyLeave.handleRefresh();
    fullLeave.handleRefresh();
    opsStatus.refresh();
  };

  return (
    <PortalGrid
      title={`Hi, ${user?.name || 'Teacher'}`}
      color={tc.primary}
      modules={modules}
      onNavigate={(route) => router.push(route as never)}
      onSearch={() => router.push('/teacher/portal-search')}
      onLogout={logout}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      header={
        <>
          <OperationsBanner status={opsStatus.data} />

          {attendanceEnabled ? (
            <View style={[styles.teacherCard, { gap: 12 }]}>
              <View style={styles.teacherCardHeaderRow}>
                <View>
                  <Text style={styles.teacherSectionTitle}>Today&apos;s Attendance</Text>
                  <Text style={styles.teacherListRowSubtext}>{formatDate(new Date().toISOString())}</Text>
                </View>
                {attendance.loading ? <ActivityIndicator color={tc.primary} /> : null}
              </View>
              {attendance.error ? <Text style={styles.inlineErrorText}>{attendance.error}</Text> : null}
              <Text style={styles.teacherEmptyText}>
                Status: {formatStatus(attendance.attendance?.status || attendance.attendance?.attendance?.status || 'Not marked')}
              </Text>
              {!attendance.attendance?.attendance && attendance.attendance?.canMarkPresent ? (
                <Pressable
                  style={[styles.teacherPrimaryButton, { backgroundColor: tc.primary }, attendance.marking && styles.teacherPrimaryButtonDisabled]}
                  onPress={attendance.markPresent}
                  disabled={attendance.marking}
                >
                  {attendance.marking ? <ActivityIndicator color="#fff" /> : <Text style={styles.teacherPrimaryButtonText}>Mark Present</Text>}
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.teacherCard}>
            <Text style={styles.teacherSectionTitle}>Today&apos;s Schedule</Text>
            {todaySlots.map((slot, index) => (
              <View key={`${slot.period}-${index}`} style={styles.teacherListRow}>
                <View style={styles.teacherListRowLeft}>
                  <View style={[styles.teacherRollBadge, { borderRadius: TeacherTheme.radii.DEFAULT, backgroundColor: tc.primary + '1f' }]}>
                    <Text style={[styles.teacherRollBadgeText, { color: tc.primary }]}>P{slot.period}</Text>
                  </View>
                  <View>
                    <Text style={styles.teacherListRowTitle}>{slot.subject || 'Subject TBD'}</Text>
                    <Text style={styles.teacherListRowSubtext}>
                      {slot.className}-{slot.sectionName}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            {todaySlots.length === 0 ? (
              <EmptyState icon="time-outline" title="No periods today" message="No periods scheduled for today." />
            ) : null}
          </View>

          <View style={[styles.teacherCard, styles.teacherLastCard]}>
            <Text style={styles.teacherSectionTitle}>At a Glance</Text>
            <Text style={styles.teacherEmptyText}>
              {activeHomeworkCount} active homework assignment{activeHomeworkCount === 1 ? '' : 's'}
            </Text>
            <Text style={styles.teacherEmptyText}>
              Early Leave:{' '}
              {latestEarlyLeave
                ? `${formatDate(latestEarlyLeave.date)} — after P${latestEarlyLeave.leaveAfterPeriod} — ${formatStatus(latestEarlyLeave.status)}`
                : 'No requests.'}
            </Text>
            <Text style={styles.teacherEmptyText}>
              Full Leave:{' '}
              {latestFullLeave
                ? `${formatDate(latestFullLeave.fromDate)} – ${formatDate(latestFullLeave.toDate)} — ${formatStatus(latestFullLeave.status)}`
                : 'No requests.'}
            </Text>
          </View>
        </>
      }
    />
  );
}
