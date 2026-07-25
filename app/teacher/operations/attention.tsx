import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsAttention } from '@/hooks/useOperationsAttention';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#b91c1c',
  HIGH: '#c2410c',
  MEDIUM: '#a16207',
  LOW: '#4b5563',
};

export default function OperationsAttentionScreen() {
  const { role } = useAuth();
  const attention = useOperationsAttention();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.teacherScreen}
      refreshControl={<RefreshControl refreshing={attention.refreshing} onRefresh={attention.handleRefresh} />}
    >
      {attention.error ? <Text style={styles.errorBanner}>{attention.error}</Text> : null}
      {attention.loading && !attention.data ? <ActivityIndicator color={tc.primary} /> : null}

      {attention.data?.attention.length === 0 ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>Nothing needs attention right now.</Text>
        </View>
      ) : null}

      {attention.data?.attention.map((item, index) => (
        <View key={item.code} style={[styles.teacherCard, index === attention.data!.attention.length - 1 && styles.teacherLastCard]}>
          <View style={styles.teacherCardHeaderRow}>
            <Text style={styles.teacherListRowTitle}>{item.title}</Text>
            <Text style={[styles.teacherPill, styles.teacherPillMuted, { color: SEVERITY_COLOR[item.severity] }]}>{item.severity}</Text>
          </View>
          <Text style={styles.teacherListRowSubtext}>{item.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
