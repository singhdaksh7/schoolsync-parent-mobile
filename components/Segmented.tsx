import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '@/lib/styles';

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  color,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  color: string;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.segment, active && { backgroundColor: color }]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
