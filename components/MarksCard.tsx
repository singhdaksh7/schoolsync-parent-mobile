import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import type { MarkItem } from '@/lib/types';
import { InfoRow } from './InfoRow';
import { EmptyState } from './EmptyState';

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
      {marks.length === 0 ? (
        <EmptyState icon="school-outline" title="No marks published yet" message="Exam results will appear here once published." />
      ) : null}
    </View>
  );
}
