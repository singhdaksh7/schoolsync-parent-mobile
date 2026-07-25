import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTeacherArrangements } from '@/hooks/useTeacherArrangements';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { CardSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { classSectionLabel, formatDate } from '@/lib/format';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

// New detail screen for a real, previously screen-less endpoint
// (GET /api/teacher/arrangements) — the old Home dashboard only showed the
// top 3 substitutions inline with no "view all" destination. Read-only: a
// normal Teacher has no management controls here (see useTeacherArrangements).
export default function TeacherSubstitutionsScreen() {
  const { role } = useAuth();
  const arrangements = useTeacherArrangements();
  const router = useRouter();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={arrangements.refreshing} onRefresh={arrangements.handleRefresh} />}
    >
      <SubScreenHeader title="Substitutions" color={TeacherTheme.colors.primary} onBack={() => router.back()} />

      {arrangements.error ? <Text style={styles.errorBanner}>{arrangements.error}</Text> : null}

      {arrangements.loading && arrangements.arrangements.length === 0 ? (
        <CardSkeleton rows={3} />
      ) : (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          {arrangements.arrangements.map((item) => (
            <View key={item.id} style={styles.teacherListRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.teacherListRowTitle}>{item.subject || 'Substitution'}</Text>
                <Text style={styles.teacherListRowSubtext}>
                  {classSectionLabel(item.section)}
                  {item.date ? ` · ${formatDate(item.date)}` : ''}
                  {item.period ? ` · P${item.period}` : ''}
                </Text>
                {item.absentTeacher?.name ? <Text style={styles.teacherListRowSubtext}>Covering for {item.absentTeacher.name}</Text> : null}
                {item.reason ? <Text style={styles.teacherMeta}>{item.reason}</Text> : null}
              </View>
            </View>
          ))}
          {arrangements.arrangements.length === 0 ? (
            <EmptyState icon="swap-horizontal-outline" title="No substitutions assigned" message="Substitution assignments will appear here." />
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}
