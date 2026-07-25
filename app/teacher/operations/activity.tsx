import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsActivity } from '@/hooks/useOperationsActivity';
import { formatDate } from '@/lib/format';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

function activityLabel(code: string): string {
  return code
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function OperationsActivityScreen() {
  const { role } = useAuth();
  const activity = useOperationsActivity();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  return (
    <ScrollView style={styles.teacherScreen} refreshControl={<RefreshControl refreshing={activity.refreshing} onRefresh={activity.handleRefresh} />}>
      {activity.error ? <Text style={styles.errorBanner}>{activity.error}</Text> : null}
      {activity.loading && activity.items.length === 0 ? <ActivityIndicator color={tc.primary} /> : null}

      {activity.items.length === 0 && !activity.loading ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>No operational activity recorded today.</Text>
        </View>
      ) : null}

      {activity.items.map((item) => (
        <View key={item.id} style={styles.teacherCard}>
          <Text style={styles.teacherListRowTitle}>{activityLabel(item.code)}</Text>
          <Text style={styles.teacherListRowSubtext}>
            {item.actorName ?? 'System'}
            {item.actorRole ? ` · ${item.actorRole}` : ''} · {formatDate(item.createdAt)}
          </Text>
        </View>
      ))}

      {activity.hasNextPage ? (
        <View style={[styles.teacherCard, styles.teacherLastCard, { alignItems: 'center' }]}>
          <Pressable
            style={[styles.teacherPrimaryButton, { backgroundColor: tc.primary, width: '100%' }, activity.loadingMore && styles.teacherPrimaryButtonDisabled]}
            onPress={activity.loadMore}
            disabled={activity.loadingMore}
          >
            {activity.loadingMore ? <ActivityIndicator color="#fff" /> : <Text style={styles.teacherPrimaryButtonText}>Load More</Text>}
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}
