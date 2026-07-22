import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTeacherArrangements } from '@/hooks/useTeacherArrangements';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { classSectionLabel, formatDate } from '@/lib/format';
import { styles } from '@/lib/styles';

// New detail screen for a real, previously screen-less endpoint
// (GET /api/teacher/arrangements) — the old Home dashboard only showed the
// top 3 substitutions inline with no "view all" destination. Read-only: a
// normal Teacher has no management controls here (see useTeacherArrangements).
export default function TeacherSubstitutionsScreen() {
  const { role, branding } = useAuth();
  const arrangements = useTeacherArrangements();
  const router = useRouter();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={arrangements.refreshing} onRefresh={arrangements.handleRefresh} />}
    >
      <SubScreenHeader title="Substitutions" color={branding.primaryColor} onBack={() => router.back()} />

      {arrangements.error ? <Text style={styles.errorBanner}>{arrangements.error}</Text> : null}

      <View style={[styles.card, styles.lastCard]}>
        {arrangements.arrangements.map((item) => (
          <View key={item.id} style={styles.teacherListItem}>
            <View style={styles.teacherListBody}>
              <Text style={styles.listRowTitle}>{item.subject || 'Substitution'}</Text>
              <Text style={styles.listRowSubtext}>
                {classSectionLabel(item.section)}
                {item.date ? ` · ${formatDate(item.date)}` : ''}
                {item.period ? ` · P${item.period}` : ''}
              </Text>
              {item.absentTeacher?.name ? <Text style={styles.listRowSubtext}>Covering for {item.absentTeacher.name}</Text> : null}
              {item.reason ? <Text style={styles.remarkText}>{item.reason}</Text> : null}
            </View>
          </View>
        ))}
        {arrangements.arrangements.length === 0 ? <Text style={styles.emptyText}>No substitutions assigned.</Text> : null}
      </View>
    </ScrollView>
  );
}
