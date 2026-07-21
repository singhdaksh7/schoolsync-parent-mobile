import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import type { MarkItem } from '@/lib/types';
import { InfoRow } from './InfoRow';

export function MarksCard({ marks }: { marks: MarkItem[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Marks</Text>
      {marks.map((item) => (
        <InfoRow
          key={item.id}
          title={item.exam.name}
          subtitle={item.exam.scheme?.name || 'Exam'}
          value={`${item.marks}/${item.exam.maxMarks}${item.grade ? ` · ${item.grade}` : ''}`}
        />
      ))}
      {marks.length === 0 ? <Text style={styles.emptyText}>No marks published yet.</Text> : null}
    </View>
  );
}
