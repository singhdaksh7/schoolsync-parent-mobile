import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsAttention } from '@/hooks/useOperationsAttention';
import { styles } from '@/lib/styles';

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#b91c1c',
  HIGH: '#c2410c',
  MEDIUM: '#a16207',
  LOW: '#4b5563',
};

export default function OperationsAttentionScreen() {
  const { role, branding } = useAuth();
  const attention = useOperationsAttention();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={attention.refreshing} onRefresh={attention.handleRefresh} />}
    >
      {attention.error ? <Text style={styles.errorBanner}>{attention.error}</Text> : null}
      {attention.loading && !attention.data ? <ActivityIndicator color={branding.primaryColor} /> : null}

      {attention.data?.attention.length === 0 ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>Nothing needs attention right now.</Text>
        </View>
      ) : null}

      {attention.data?.attention.map((item, index) => (
        <View key={item.code} style={[styles.card, index === attention.data!.attention.length - 1 && styles.lastCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.listRowTitle}>{item.title}</Text>
            <Text style={[styles.statusPill, { color: SEVERITY_COLOR[item.severity] }]}>{item.severity}</Text>
          </View>
          <Text style={styles.listRowSubtext}>{item.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
