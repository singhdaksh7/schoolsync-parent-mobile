import React, { useMemo } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { useTeacherSchedule } from '@/hooks/useTeacherSchedule';
import { styles } from '@/lib/styles';
import { DAY_NAMES } from '@/lib/types';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

export default function TeacherScheduleScreen() {
  const { role } = useAuth();
  const schedule = useTeacherSchedule();
  const insets = useSafeAreaInsets();
  const byDay = useMemo(() => {
    const groups = new Map<number, typeof schedule.slots>();
    for (const slot of schedule.slots) {
      const list = groups.get(slot.dayOfWeek) ?? [];
      list.push(slot);
      groups.set(slot.dayOfWeek, list);
    }
    for (const list of groups.values()) list.sort((a, b) => a.period - b.period);
    return [...groups.entries()].sort(([a], [b]) => a - b);
  }, [schedule.slots]);

  if (role !== 'TEACHER') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={schedule.refreshing} onRefresh={schedule.handleRefresh} />}
    >
      <View style={[styles.teacherHeader, { paddingTop: insets.top + styles.teacherHeader.paddingVertical }]}>
        <Text style={styles.teacherHeaderTitle}>Schedule</Text>
        {schedule.loading ? <ActivityIndicator color="#fff" /> : null}
      </View>

      {schedule.error ? <Text style={styles.errorBanner}>{schedule.error}</Text> : null}

      {byDay.map(([dayOfWeek, slots]) => (
        <View key={dayOfWeek} style={styles.teacherCard}>
          <Text style={styles.teacherSectionTitle}>{DAY_NAMES[dayOfWeek] || `Day ${dayOfWeek}`}</Text>
          {slots.map((slot, index) => (
            <View key={`${dayOfWeek}-${slot.period}-${index}`} style={styles.teacherListRow}>
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
        </View>
      ))}

      {byDay.length === 0 && !schedule.loading ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>No timetable available.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
