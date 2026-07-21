import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import { DAY_NAMES, type TimetableItem } from '@/lib/types';
import { InfoRow } from './InfoRow';

export function TimetableCard({ timetable, title = 'Timetable' }: { timetable: TimetableItem[]; title?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {timetable.map((slot) => (
        <InfoRow
          key={slot.id}
          title={`${DAY_NAMES[slot.dayOfWeek] || `Day ${slot.dayOfWeek}`} - P${slot.period}`}
          subtitle={slot.teacher?.name || 'Teacher not assigned'}
          value={slot.subject || 'Subject TBD'}
        />
      ))}
      {timetable.length === 0 ? <Text style={styles.emptyText}>No timetable available.</Text> : null}
    </View>
  );
}
