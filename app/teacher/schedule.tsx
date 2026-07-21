import React, { useMemo } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTeacherSchedule } from '@/hooks/useTeacherSchedule';
import { styles } from '@/lib/styles';
import { DAY_NAMES } from '@/lib/types';

export default function TeacherScheduleScreen() {
  const { role, branding } = useAuth();
  const schedule = useTeacherSchedule();
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
      <View style={[styles.header, { backgroundColor: branding.primaryColor }]}>
        <Text style={styles.title}>Schedule</Text>
        {schedule.loading ? <ActivityIndicator color="#fff" /> : null}
      </View>

      {schedule.error ? <Text style={styles.errorBanner}>{schedule.error}</Text> : null}

      {byDay.map(([dayOfWeek, slots]) => (
        <View key={dayOfWeek} style={styles.card}>
          <Text style={styles.sectionTitle}>{DAY_NAMES[dayOfWeek] || `Day ${dayOfWeek}`}</Text>
          {slots.map((slot, index) => (
            <View key={`${dayOfWeek}-${slot.period}-${index}`} style={styles.teacherListItem}>
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
        </View>
      ))}

      {byDay.length === 0 && !schedule.loading ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>No timetable available.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
