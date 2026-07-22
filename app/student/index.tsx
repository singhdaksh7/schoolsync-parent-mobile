import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { PortalGrid } from '@/components/PortalGrid';
import { StudentHomeworkCard } from '@/components/StudentCards';
import { StudentLeaveCard } from '@/components/StudentLeaveCard';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { useStudentLeave } from '@/hooks/useStudentLeave';
import { computeVisibleStudentPortalModules } from '@/lib/student-portal-modules';
import { styles } from '@/lib/styles';

// Grid-menu landing screen for the Student Portal (Profile/Timetable/
// Attendance/Marks/Report Cards/Announcements) — promoted from behind a hero
// tile (PR #2) to be app/student's actual landing screen. Only surfaces
// tiles that are (a) backed by a real Student API route and (b)
// feature-enabled for the school — see lib/student-portal-modules.ts for the
// (unit-tested) visibility rule.
//
// Homework and Leave have no grid tile (PR #2 deliberately scoped the grid
// to 6 modules) but are real, functional features of the old dashboard this
// screen replaces — folded in here as full interactive cards (not a
// read-only summary) so submitting homework and requesting leave stay
// reachable and working, not silently dropped.
export default function StudentScreen() {
  const { role, studentProfile, studentSchool, branding, logout } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const dashboard = useStudentDashboard();
  const leave = useStudentLeave();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const modules = computeVisibleStudentPortalModules(hasFeature);
  const className = studentProfile?.section?.class?.name;
  const sectionName = studentProfile?.section?.name;
  const classSection = className && sectionName ? `${className} - ${sectionName}` : className || sectionName || null;
  const initial = (studentProfile?.name || 'S').trim().charAt(0).toUpperCase();

  const refreshing = dashboard.refreshing || leave.refreshing;
  const handleRefresh = () => {
    dashboard.handleRefresh();
    leave.handleRefresh();
  };

  return (
    <PortalGrid
      title="Student Portal"
      color={branding.primaryColor}
      modules={modules}
      onNavigate={(route) => router.push(route as never)}
      onSearch={() => router.push('/student/portal-search')}
      onLogout={logout}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      header={
        <>
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

          {dashboard.error ? (
            <View style={styles.inlineError}>
              <Text style={styles.inlineErrorTitle}>Could not refresh student data</Text>
              <Text style={styles.inlineErrorText}>{dashboard.error}</Text>
            </View>
          ) : null}

          <StudentHomeworkCard homework={dashboard.homework} />

          <StudentLeaveCard
            leaves={leave.leaves}
            loading={leave.loading}
            creating={leave.creating}
            error={leave.error}
            color={branding.primaryColor}
            onCreate={leave.createLeave}
          />
        </>
      }
    />
  );
}
