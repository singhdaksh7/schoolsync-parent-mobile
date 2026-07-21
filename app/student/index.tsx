import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { ActorHeader } from '@/components/BrandHeader';
import { AnnouncementsCard } from '@/components/AnnouncementsCard';
import { MarksCard } from '@/components/MarksCard';
import { ReportCardsCard } from '@/components/ReportCardsCard';
import { StudentAttendanceCard, StudentHomeworkCard, StudentTodayTimetableCard } from '@/components/StudentCards';
import { StudentLeaveCard } from '@/components/StudentLeaveCard';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { useStudentLeave } from '@/hooks/useStudentLeave';
import { useAuth } from '@/lib/auth-context';
import { roleLabel } from '@/lib/format';
import { styles } from '@/lib/styles';

export default function StudentScreen() {
  const { role, studentProfile, studentSchool, branding, logout, token } = useAuth();
  const dashboard = useStudentDashboard();
  const leave = useStudentLeave();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const className = studentProfile?.section?.class?.name;
  const sectionName = studentProfile?.section?.name;
  const classSection = className && sectionName ? `${className} - ${sectionName}` : className || sectionName || null;
  const initial = (studentProfile?.name || 'S').trim().charAt(0).toUpperCase();
  const hasData =
    dashboard.attendance.length > 0 ||
    dashboard.homework.length > 0 ||
    dashboard.todayTimetable.length > 0 ||
    dashboard.marks.length > 0 ||
    dashboard.reportCards.length > 0 ||
    dashboard.announcements.length > 0 ||
    dashboard.attendanceSummary !== null;

  const refreshing = dashboard.refreshing || leave.refreshing;
  const handleRefresh = () => {
    dashboard.handleRefresh();
    leave.handleRefresh();
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <ActorHeader
        branding={branding}
        userName={studentProfile?.name || 'Student'}
        roleLabel={roleLabel(role)}
        onLogout={logout}
      />

      {dashboard.error ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorTitle}>Could not refresh student data</Text>
          <Text style={styles.inlineErrorText}>{dashboard.error}</Text>
        </View>
      ) : null}

      <View style={[styles.card, styles.studentProfileCard]}>
        <View style={[styles.studentAvatar, { backgroundColor: branding.primaryColor }]}>
          <Text style={styles.studentAvatarText}>{initial}</Text>
        </View>
        <View style={styles.studentProfileBody}>
          <Text style={styles.studentName}>{studentProfile?.name || 'Student'}</Text>
          <Text style={styles.studentClassLine}>{classSection || 'Class & section not provided'}</Text>
          <View style={styles.studentMetaRow}>
            <Text style={styles.studentMetaPill}>Roll {studentProfile?.rollNo || '--'}</Text>
            {studentProfile?.admissionNo ? <Text style={styles.studentMetaPill}>Adm {studentProfile.admissionNo}</Text> : null}
          </View>
          <Text style={styles.studentSchool}>{studentSchool?.name || 'School'}</Text>
        </View>
        {dashboard.loading ? <ActivityIndicator color={branding.primaryColor} /> : null}
      </View>

      {dashboard.loading && !hasData ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={branding.primaryColor} />
        </View>
      ) : (
        <>
          <StudentAttendanceCard attendance={dashboard.attendance} summary={dashboard.attendanceSummary} color={branding.primaryColor} />
          <StudentHomeworkCard homework={dashboard.homework} />
          <StudentTodayTimetableCard timetable={dashboard.todayTimetable} color={branding.primaryColor} />
          <MarksCard marks={dashboard.marks} />
          <ReportCardsCard reportCards={dashboard.reportCards} token={token} pdfPathPrefix="/api/student/report-cards" />
          <StudentLeaveCard
            leaves={leave.leaves}
            loading={leave.loading}
            creating={leave.creating}
            error={leave.error}
            color={branding.primaryColor}
            onCreate={leave.createLeave}
          />
          <AnnouncementsCard announcements={dashboard.announcements} />
        </>
      )}
    </ScrollView>
  );
}
