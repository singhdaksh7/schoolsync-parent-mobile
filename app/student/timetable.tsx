import React, { useMemo, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { GlassSurface } from '@/components/GlassSurface';
import { LiquidBackground } from '@/components/LiquidBackground';
import { StudentTopBar } from '@/components/StudentTopBar';
import { StudentBottomNav } from '@/components/StudentBottomNav';
import { CardSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { DAY_NAMES } from '@/lib/types';
import { Theme } from '@/constants/theme';
import { styles } from '@/lib/styles';

function todayBackendDayOfWeek() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

const PERIOD_COLORS = [Theme.colors.primary, Theme.colors.secondary, Theme.colors.tertiary, Theme.colors.error];

// Stitch "student-portal-timetable" rebuilt: horizontal day-tab strip (real
// days derived from the actual timetable data, not fake calendar dates) +
// vertical period list (badge, subject, time-range IF start/end times exist,
// teacher). Room/location is dropped — TimetableItem has no such field.
// Footer bento kept (not dropped): "Upcoming Assignment" and "Attendance
// Rate" are both real, already-fetched data (dashboard.homework /
// attendanceSummary), just composed the way Stitch's footer bento does.
export default function StudentTimetableScreen() {
  const { role, branding } = useAuth();
  const dashboard = useStudentDashboard();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysWithClasses = useMemo(
    () => Array.from(new Set(dashboard.timetable.map((slot) => slot.dayOfWeek))).sort((a, b) => a - b),
    [dashboard.timetable]
  );

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const today = todayBackendDayOfWeek();
  const activeDay = selectedDay ?? (daysWithClasses.includes(today) ? today : daysWithClasses[0]);
  const periodsForDay = dashboard.timetable
    .filter((slot) => slot.dayOfWeek === activeDay)
    .sort((a, b) => a.period - b.period);

  const upcomingHomework = [...dashboard.homework]
    .filter((item) => item.homeworkStatus === 'ACTIVE')
    .sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime())[0];

  return (
    <View style={styles.liquidScreen}>
      <LiquidBackground
        blobs={[
          { color: Theme.colors.primaryContainer, size: 200, top: -60, right: -60 },
          { color: Theme.colors.secondaryContainer, size: 160, bottom: 100, left: -80 },
        ]}
      />
      <StudentTopBar title="Timetable" onBack={() => router.back()} color={branding.primaryColor} />

      <ScrollView
        contentContainerStyle={styles.liquidScrollContent}
        refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
      >
        {dashboard.loading && dashboard.timetable.length === 0 ? (
          <CardSkeleton rows={5} />
        ) : dashboard.timetable.length === 0 ? (
          <EmptyState icon="calendar-clear-outline" title="No timetable available" message="Your class schedule will appear here." />
        ) : (
          <>
            <GlassSurface style={styles.liquidDayTabs} intensity={35}>
              {daysWithClasses.map((day) => {
                const isActive = day === activeDay;
                return (
                  <Pressable key={day} style={[styles.liquidDayTab, isActive && styles.liquidDayTabActive]} onPress={() => setSelectedDay(day)}>
                    <Text style={[styles.liquidDayTabLabel, isActive && styles.liquidDayTabLabelActive]}>
                      {(DAY_NAMES[day] || `D${day}`).toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </GlassSurface>

            <View style={{ marginTop: Theme.spacing.lg }}>
              {periodsForDay.map((slot, i) => {
                const color = PERIOD_COLORS[i % PERIOD_COLORS.length];
                return (
                  <GlassSurface key={slot.id} style={styles.liquidPeriodRow} intensity={30}>
                    <View style={[styles.liquidPeriodBadge, { backgroundColor: color + '1a', borderColor: color + '33' }]}>
                      <Text style={[styles.liquidPeriodBadgeNum, { color }]}>{String(slot.period).padStart(2, '0')}</Text>
                      <Text style={[styles.liquidPeriodBadgeLabel, { color }]}>Prd</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.liquidPeriodTitleRow}>
                        <Text style={styles.liquidPeriodSubject}>{slot.subject || 'Subject TBD'}</Text>
                        {slot.startTime && slot.endTime ? (
                          <Text style={[styles.liquidPeriodTimePill, { color, backgroundColor: color + '0d' }]}>
                            {slot.startTime} - {slot.endTime}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.liquidPeriodMetaRow}>
                        <Ionicons name="person-outline" size={14} color={Theme.colors.onSurfaceVariant} />
                        <Text style={styles.listRowSubtext}>{slot.teacher?.name || 'Teacher not assigned'}</Text>
                      </View>
                    </View>
                  </GlassSurface>
                );
              })}
              {periodsForDay.length === 0 ? (
                <EmptyState icon="cafe-outline" title="No periods" message="Nothing scheduled for this day." />
              ) : null}
            </View>

            {upcomingHomework || dashboard.attendanceSummary ? (
              <View style={[styles.liquidStatRow, { marginTop: Theme.spacing.xl }]}>
                {upcomingHomework ? (
                  <GlassSurface style={[styles.liquidCard, { flex: 2, marginBottom: 0 }]} intensity={35}>
                    <Text style={styles.sectionTitle}>Upcoming Assignment</Text>
                    <View style={styles.liquidCardRow}>
                      <View style={[styles.liquidTileIconWrap, { backgroundColor: branding.primaryColor + '1a' }]}>
                        <Ionicons name="create-outline" size={22} color={branding.primaryColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listRowTitle} numberOfLines={1}>{upcomingHomework.title}</Text>
                        <Text style={styles.listRowSubtext}>{upcomingHomework.subject}</Text>
                      </View>
                    </View>
                  </GlassSurface>
                ) : null}
                {dashboard.attendanceSummary ? (
                  <GlassSurface style={[styles.liquidStatCard, { flex: 1, alignItems: 'center', justifyContent: 'center' }]} intensity={35}>
                    <Text style={[styles.liquidHeroValue, { fontSize: 28 }]}>{dashboard.attendanceSummary.percentage}%</Text>
                    <Text style={styles.liquidMiniStatLabel}>Attendance</Text>
                  </GlassSurface>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <StudentBottomNav active="schedule" color={branding.primaryColor} />
    </View>
  );
}
