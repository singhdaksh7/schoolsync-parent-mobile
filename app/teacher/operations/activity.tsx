import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsActivity } from '@/hooks/useOperationsActivity';
import { formatDate } from '@/lib/format';
import { styles } from '@/lib/styles';

function activityLabel(code: string): string {
  return code
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function OperationsActivityScreen() {
  const { role, branding } = useAuth();
  const activity = useOperationsActivity();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={activity.refreshing} onRefresh={activity.handleRefresh} />}>
      {activity.error ? <Text style={styles.errorBanner}>{activity.error}</Text> : null}
      {activity.loading && activity.items.length === 0 ? <ActivityIndicator color={branding.primaryColor} /> : null}

      {activity.items.length === 0 && !activity.loading ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>No operational activity recorded today.</Text>
        </View>
      ) : null}

      {activity.items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.listRowTitle}>{activityLabel(item.code)}</Text>
          <Text style={styles.listRowSubtext}>
            {item.actorName ?? 'System'}
            {item.actorRole ? ` · ${item.actorRole}` : ''} · {formatDate(item.createdAt)}
          </Text>
        </View>
      ))}

      {activity.hasNextPage ? (
        <View style={[styles.card, styles.lastCard, { alignItems: 'center' }]}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: branding.primaryColor }, activity.loadingMore && styles.primaryButtonDisabled]}
            onPress={activity.loadMore}
            disabled={activity.loadingMore}
          >
            {activity.loadingMore ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Load More</Text>}
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}
