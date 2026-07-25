import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Segmented } from '@/components/Segmented';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useTeacherPermissions } from '@/hooks/useTeacherPermissions';
import { useTeacherProfile } from '@/hooks/useTeacherProfile';
import { useTeacherSelfAttendance } from '@/hooks/useTeacherSelfAttendance';
import { useStudentAttendance, type StudentAttendanceStatus } from '@/hooks/useStudentAttendance';
import { can } from '@/lib/teacher-permissions';
import { formatStatus } from '@/lib/format';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

type AttendanceTab = 'MY_ATTENDANCE' | 'STUDENT_ATTENDANCE';

const STATUS_OPTIONS: StudentAttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE'];

export default function TeacherAttendanceScreen() {
  const { role } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const permissions = useTeacherPermissions();
  const profile = useTeacherProfile();
  const selfAttendance = useTeacherSelfAttendance();
  const roster = profile.profile?.mentorSection?.students ?? [];
  const studentAttendance = useStudentAttendance(roster);
  const [tab, setTab] = useState<AttendanceTab>('MY_ATTENDANCE');
  const insets = useSafeAreaInsets();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const attendanceEnabled = hasFeature('ATTENDANCE');
  const canViewStudents = can(permissions.data, 'ATTENDANCE', 'VIEW', { sectionId: profile.profile?.mentorSectionId ?? undefined });
  const canMarkStudents = can(permissions.data, 'ATTENDANCE', 'MARK', { sectionId: profile.profile?.mentorSectionId ?? undefined });

  const status = selfAttendance.attendance?.status || selfAttendance.attendance?.attendance?.status || 'Not marked';
  const isPresent = status === 'PRESENT';
  const canMarkSelf = selfAttendance.attendance?.canMarkPresent ?? false;
  const cutoffPassed = selfAttendance.attendance?.cutoffPassed ?? false;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={tab === 'MY_ATTENDANCE' ? selfAttendance.refreshing : studentAttendance.refreshing}
          onRefresh={tab === 'MY_ATTENDANCE' ? selfAttendance.handleRefresh : studentAttendance.handleRefresh}
        />
      }
    >
      <View style={[styles.teacherHeader, { paddingTop: insets.top + styles.teacherHeader.paddingVertical }]}>
        <Text style={styles.teacherHeaderTitle}>Attendance</Text>
      </View>

      {!attendanceEnabled ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>Attendance is not enabled for your school.</Text>
        </View>
      ) : (
        <>
          <View style={styles.teacherCard}>
            <Segmented
              value={tab}
              options={[
                { value: 'MY_ATTENDANCE', label: 'My Attendance' },
                { value: 'STUDENT_ATTENDANCE', label: 'Student Attendance' },
              ]}
              onChange={setTab}
              color={tc.primary}
            />
          </View>

          {tab === 'MY_ATTENDANCE' ? (
            <View style={[styles.teacherCard, styles.teacherLastCard, { gap: 12 }]}>
              <View style={styles.teacherCardHeaderRow}>
                <View>
                  <Text style={styles.teacherSectionTitle}>Your Attendance Today</Text>
                  <Text style={styles.teacherListRowSubtext}>Self check-in</Text>
                </View>
                <Text style={[styles.teacherPill, isPresent ? styles.teacherPillPresent : styles.teacherPillMuted]}>
                  {formatStatus(status)}
                </Text>
              </View>
              {selfAttendance.error ? <Text style={styles.inlineErrorText}>{selfAttendance.error}</Text> : null}
              <Pressable
                style={[
                  styles.teacherPrimaryButton,
                  { backgroundColor: isPresent ? tc.surfaceContainerHigh : tc.primary },
                  (selfAttendance.loading || selfAttendance.marking || !canMarkSelf) && styles.teacherPrimaryButtonDisabled,
                ]}
                onPress={selfAttendance.markPresent}
                disabled={selfAttendance.loading || selfAttendance.marking || !canMarkSelf}
              >
                {selfAttendance.marking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.teacherPrimaryButtonText}>{isPresent ? 'Present Marked' : cutoffPassed ? 'Cutoff Passed' : 'Mark Present'}</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={[styles.teacherCard, styles.teacherLastCard]}>
              <View style={styles.teacherCardHeaderRow}>
                <Text style={styles.teacherSectionTitle}>Mentor Section Attendance</Text>
                {(profile.loading || studentAttendance.loading) ? <ActivityIndicator color={tc.primary} /> : null}
              </View>
              <Text style={styles.teacherListRowSubtext}>{studentAttendance.date}</Text>

              {!profile.profile?.mentorSectionId ? (
                <Text style={styles.teacherEmptyText}>No mentor section assigned — student attendance is unavailable.</Text>
              ) : !canViewStudents ? (
                <Text style={styles.teacherEmptyText}>You do not have permission to view student attendance.</Text>
              ) : (
                <>
                  {studentAttendance.error ? <Text style={styles.inlineErrorText}>{studentAttendance.error}</Text> : null}
                  {studentAttendance.rows.map((row) => (
                    <View key={row.studentId} style={styles.teacherListRow}>
                      <View style={styles.teacherListRowLeft}>
                        <View style={styles.teacherRollBadge}>
                          <Text style={styles.teacherRollBadgeText}>{row.rollNo}</Text>
                        </View>
                        <View>
                          <Text style={styles.teacherListRowTitle}>{row.name}</Text>
                          <Text style={styles.teacherListRowSubtext}>Roll {row.rollNo}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {STATUS_OPTIONS.map((option) => {
                          const selected = row.status === option;
                          return (
                            <Pressable
                              key={option}
                              disabled={!canMarkStudents}
                              onPress={() => studentAttendance.setStatus(row.studentId, option)}
                              style={[
                                styles.teacherTogglePill,
                                selected && { backgroundColor: tc.secondary, borderColor: tc.secondary },
                              ]}
                            >
                              <Text style={[styles.teacherTogglePillText, selected && { color: '#fff' }]}>
                                {option === 'PRESENT' ? 'P' : option === 'ABSENT' ? 'A' : 'L'}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                  {studentAttendance.rows.length === 0 ? <Text style={styles.teacherEmptyText}>No students in your mentor section.</Text> : null}

                  {canMarkStudents ? (
                    <Pressable
                      style={[
                        styles.teacherPrimaryButton,
                        { backgroundColor: tc.primary, marginTop: 12 },
                        (!studentAttendance.hasEdits || studentAttendance.submitting) && styles.teacherPrimaryButtonDisabled,
                      ]}
                      onPress={studentAttendance.submit}
                      disabled={!studentAttendance.hasEdits || studentAttendance.submitting}
                    >
                      {studentAttendance.submitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.teacherPrimaryButtonText}>Submit Attendance</Text>
                      )}
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
