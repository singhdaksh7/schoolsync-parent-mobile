import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/lib/styles';

export function InfoRow({ title, subtitle, value }: { title: string; subtitle?: string; value?: string }) {
  return (
    <View style={styles.listRow}>
      <View style={styles.listRowLeft}>
        <Text style={styles.listRowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listRowSubtext}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.listRowValue}>{value}</Text> : null}
    </View>
  );
}
