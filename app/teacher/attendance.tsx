import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
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

type AttendanceTab = 'MY_ATTENDANCE' | 'STUDENT_ATTENDANCE';

const STATUS_OPTIONS: StudentAttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE'];

export default function TeacherAttendanceScreen() {
  const { role, branding } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const permissions = useTeacherPermissions();
  const profile = useTeacherProfile();
  const selfAttendance = useTeacherSelfAttendance();
  const roster = profile.profile?.mentorSection?.students ?? [];
  const studentAttendance = useStudentAttendance(roster);
  const [tab, setTab] = useState<AttendanceTab>('MY_ATTENDANCE');

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
      <View style={[styles.header, { backgroundColor: branding.primaryColor }]}>
        <Text style={styles.title}>Attendance</Text>
      </View>

      {!attendanceEnabled ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>Attendance is not enabled for your school.</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Segmented
              value={tab}
              options={[
                { value: 'MY_ATTENDANCE', label: 'My Attendance' },
                { value: 'STUDENT_ATTENDANCE', label: 'Student Attendance' },
              ]}
              onChange={setTab}
              color={branding.primaryColor}
            />
          </View>

          {tab === 'MY_ATTENDANCE' ? (
            <View style={[styles.card, styles.attendanceCard, styles.lastCard]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Your Attendance Today</Text>
                  <Text style={styles.listRowSubtext}>Self check-in</Text>
                </View>
                <Text style={[styles.statusBadge, isPresent ? styles.statusBadgeSuccess : styles.statusBadgeMuted]}>
                  {formatStatus(status)}
                </Text>
              </View>
              {selfAttendance.error ? <Text style={styles.inlineErrorText}>{selfAttendance.error}</Text> : null}
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: isPresent ? '#94a3b8' : branding.primaryColor },
                  (selfAttendance.loading || selfAttendance.marking || !canMarkSelf) && styles.primaryButtonDisabled,
                ]}
                onPress={selfAttendance.markPresent}
                disabled={selfAttendance.loading || selfAttendance.marking || !canMarkSelf}
              >
                {selfAttendance.marking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>{isPresent ? 'Present Marked' : cutoffPassed ? 'Cutoff Passed' : 'Mark Present'}</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={[styles.card, styles.lastCard]}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionTitle}>Mentor Section Attendance</Text>
                {(profile.loading || studentAttendance.loading) ? <ActivityIndicator color={branding.primaryColor} /> : null}
              </View>
              <Text style={styles.listRowSubtext}>{studentAttendance.date}</Text>

              {!profile.profile?.mentorSectionId ? (
                <Text style={styles.emptyText}>No mentor section assigned — student attendance is unavailable.</Text>
              ) : !canViewStudents ? (
                <Text style={styles.emptyText}>You do not have permission to view student attendance.</Text>
              ) : (
                <>
                  {studentAttendance.error ? <Text style={styles.inlineErrorText}>{studentAttendance.error}</Text> : null}
                  {studentAttendance.rows.map((row) => (
                    <View key={row.studentId} style={styles.teacherListItem}>
                      <View style={styles.teacherListBody}>
                        <Text style={styles.listRowTitle}>{row.name}</Text>
                        <Text style={styles.listRowSubtext}>Roll {row.rollNo}</Text>
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
                                styles.methodPill,
                                selected && { backgroundColor: branding.primaryColor },
                              ]}
                            >
                              <Text style={[{ fontSize: 10, fontWeight: '700', color: selected ? '#fff' : '#374151' }]}>
                                {option === 'PRESENT' ? 'P' : option === 'ABSENT' ? 'A' : 'L'}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                  {studentAttendance.rows.length === 0 ? <Text style={styles.emptyText}>No students in your mentor section.</Text> : null}

                  {canMarkStudents ? (
                    <Pressable
                      style={[
                        styles.primaryButton,
                        { backgroundColor: branding.primaryColor },
                        (!studentAttendance.hasEdits || studentAttendance.submitting) && styles.primaryButtonDisabled,
                      ]}
                      onPress={studentAttendance.submit}
                      disabled={!studentAttendance.hasEdits || studentAttendance.submitting}
                    >
                      {studentAttendance.submitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Submit Attendance</Text>
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
