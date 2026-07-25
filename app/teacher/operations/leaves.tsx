import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useOperationsLeaves } from '@/hooks/useOperationsLeaves';
import { useTeacherProfile } from '@/hooks/useTeacherProfile';
import { isSelfOperationsTarget } from '@/lib/operations-self-protection';
import { formatDate } from '@/lib/format';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

export default function OperationsLeavesScreen() {
  const { role } = useAuth();
  const leaves = useOperationsLeaves();
  const profile = useTeacherProfile();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const myTeacherId = profile.profile?.id;
  const requests = leaves.data?.data ?? [];

  return (
    <ScrollView style={styles.teacherScreen} refreshControl={<RefreshControl refreshing={leaves.refreshing} onRefresh={leaves.handleRefresh} />}>
      {leaves.error ? <Text style={styles.errorBanner}>{leaves.error}</Text> : null}
      {leaves.loading && !leaves.data ? <ActivityIndicator color={tc.primary} /> : null}

      {requests.length === 0 && !leaves.loading ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>No pending teacher leave requests.</Text>
        </View>
      ) : null}

      {requests.map((request, index) => {
        const isSelf = isSelfOperationsTarget(request.teacherId, myTeacherId);
        return (
          <View key={request.id} style={[styles.teacherCard, index === requests.length - 1 && styles.teacherLastCard]}>
            <Text style={styles.teacherListRowTitle}>
              {request.teacher?.name ?? 'Unknown teacher'}
              {isSelf ? ' (You)' : ''}
            </Text>
            <Text style={styles.teacherListRowSubtext}>
              {formatDate(request.fromDate)} – {formatDate(request.toDate)}
            </Text>
            <Text style={styles.teacherMeta}>{request.reason}</Text>

            {isSelf ? (
              <Text style={styles.teacherListRowSubtext}>You cannot approve or reject your own leave request.</Text>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Pressable
                  style={[styles.smallButton, { backgroundColor: tc.success }]}
                  onPress={() => leaves.decide(request.id, 'APPROVED')}
                  disabled={leaves.decidingId === request.id}
                >
                  {leaves.decidingId === request.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallButtonText}>Approve</Text>}
                </Pressable>
                <Pressable
                  style={[styles.smallButton, { backgroundColor: tc.error }]}
                  onPress={() => leaves.decide(request.id, 'REJECTED')}
                  disabled={leaves.decidingId === request.id}
                >
                  {leaves.decidingId === request.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallButtonText}>Reject</Text>}
                </Pressable>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
