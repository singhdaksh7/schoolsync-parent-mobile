import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/lib/styles';

export function TeacherSection({
  title,
  emptyText,
  children,
  last,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const childArray = React.Children.toArray(children);
  return (
    <View style={[styles.card, last && styles.lastCard]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {childArray.length > 0 ? childArray : <Text style={styles.emptyText}>{emptyText}</Text>}
    </View>
  );
}
