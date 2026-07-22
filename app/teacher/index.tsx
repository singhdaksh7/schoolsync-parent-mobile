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
import { styles } from '@/lib/styles';

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
  const { role, user, branding, logout } = useAuth();
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
      color={branding.primaryColor}
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

          <View style={[styles.card, styles.lastCard]}>
            <Text style={styles.sectionTitle}>At a Glance</Text>
            <Text style={styles.emptyText}>
              {activeHomeworkCount} active homework assignment{activeHomeworkCount === 1 ? '' : 's'}
            </Text>
            <Text style={styles.emptyText}>
              Early Leave:{' '}
              {latestEarlyLeave
                ? `${formatDate(latestEarlyLeave.date)} — after P${latestEarlyLeave.leaveAfterPeriod} — ${formatStatus(latestEarlyLeave.status)}`
                : 'No requests.'}
            </Text>
            <Text style={styles.emptyText}>
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
