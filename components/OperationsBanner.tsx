import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { describeOperationsBanner } from '@/lib/operations-banner';
import type { TeacherOperationsSelfStatus } from '@/lib/types';

const bannerStyles = StyleSheet.create({
  banner: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  text: { color: '#9a3412', fontSize: 13, fontWeight: '700', lineHeight: 18 },
});

/** Restrained banner only — the full Teacher Operations Command Center is a
 * later Phase 6 stage. Never renders the raw reasonCode. */
export function OperationsBanner({ status }: { status: TeacherOperationsSelfStatus | null | undefined }) {
  const message = describeOperationsBanner(status);
  if (!message) return null;
  return (
    <View style={bannerStyles.banner}>
      <Text style={bannerStyles.text}>{message}</Text>
    </View>
  );
}
