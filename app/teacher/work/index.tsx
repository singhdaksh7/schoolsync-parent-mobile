import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useTeacherPermissions } from '@/hooks/useTeacherPermissions';
import { computeVisibleWorkModules } from '@/lib/work-modules';
import { styles } from '@/lib/styles';

// Only surfaces modules that (a) have a real, bearer-reachable route AND (b)
// are feature-enabled AND (c) the teacher has at least VIEW permission for.
// No card here ever leads to a "not implemented" screen. See
// lib/work-modules.ts for the (unit-tested) visibility rule itself.
export default function TeacherWorkHubScreen() {
  const { role } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const permissions = useTeacherPermissions();
  const router = useRouter();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const modules = computeVisibleWorkModules(hasFeature, permissions.data);

  return (
    <ScrollView style={styles.teacherScreen}>
      <View style={styles.teacherHeader}>
        <Text style={styles.teacherHeaderTitle}>Work</Text>
      </View>

      {modules.map((module) => (
        <Pressable key={module.key} style={styles.teacherCard} onPress={() => router.push(module.route)}>
          <Text style={styles.teacherCardTitle}>{module.title}</Text>
          <Text style={styles.teacherListRowSubtext}>{module.description}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.teacherCard} onPress={() => router.push('/teacher/work/leaves')}>
        <Text style={styles.teacherCardTitle}>Early Leave</Text>
        <Text style={styles.teacherListRowSubtext}>Request to leave after a period today, and view your past requests.</Text>
      </Pressable>

      <Pressable style={[styles.teacherCard, styles.teacherLastCard]} onPress={() => router.push('/teacher/work/full-leave')}>
        <Text style={styles.teacherCardTitle}>Full Leave</Text>
        <Text style={styles.teacherListRowSubtext}>Request a multi-day leave and view your past requests.</Text>
      </Pressable>
    </ScrollView>
  );
}
