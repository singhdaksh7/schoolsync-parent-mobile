import React from 'react';
import { Redirect } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTeacherPermissions } from '@/hooks/useTeacherPermissions';
import { roleLabel } from '@/lib/format';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

export default function TeacherProfileScreen() {
  const { role, user, branding, logout } = useAuth();
  const permissions = useTeacherPermissions();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  return (
    <ScrollView style={styles.teacherScreen}>
      <View style={styles.teacherHeader}>
        <Text style={styles.teacherHeaderTitle}>Profile</Text>
      </View>

      <View style={styles.teacherCard}>
        <Text style={styles.teacherSectionTitle}>{user?.name}</Text>
        <Text style={styles.teacherListRowSubtext}>{user?.email}</Text>
        <Text style={[styles.teacherPill, styles.teacherPillMuted, { marginTop: 8 }]}>{roleLabel(role)}</Text>
      </View>

      <View style={styles.teacherCard}>
        <Text style={styles.teacherSectionTitle}>School</Text>
        <Text style={styles.teacherListRowSubtext}>{branding.schoolName}</Text>
      </View>

      {permissions.data?.hasCustomRole ? (
        <View style={styles.teacherCard}>
          <Text style={styles.teacherSectionTitle}>Custom Role Scope</Text>
          <Text style={styles.teacherListRowSubtext}>
            {permissions.data.scope.unrestricted ? 'Unrestricted' : `${permissions.data.scope.sectionIds.length} section(s)`}
          </Text>
        </View>
      ) : null}

      <View style={[styles.teacherCard, styles.teacherLastCard]}>
        <Pressable style={[styles.teacherPrimaryButton, { backgroundColor: tc.primary }]} onPress={logout}>
          <Text style={styles.teacherPrimaryButtonText}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
