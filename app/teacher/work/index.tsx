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
  const { role, branding } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const permissions = useTeacherPermissions();
  const router = useRouter();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const modules = computeVisibleWorkModules(hasFeature, permissions.data);

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: branding.primaryColor }]}>
        <Text style={styles.title}>Work</Text>
      </View>

      {modules.map((module) => (
        <Pressable key={module.key} style={styles.card} onPress={() => router.push(module.route)}>
          <Text style={styles.sectionTitle}>{module.title}</Text>
          <Text style={styles.listRowSubtext}>{module.description}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.card} onPress={() => router.push('/teacher/work/leaves')}>
        <Text style={styles.sectionTitle}>Early Leave</Text>
        <Text style={styles.listRowSubtext}>Request to leave after a period today, and view your past requests.</Text>
      </Pressable>

      <Pressable style={[styles.card, styles.lastCard]} onPress={() => router.push('/teacher/work/full-leave')}>
        <Text style={styles.sectionTitle}>Full Leave</Text>
        <Text style={styles.listRowSubtext}>Request a multi-day leave and view your past requests.</Text>
      </Pressable>
    </ScrollView>
  );
}
