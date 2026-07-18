import React from 'react';
import { Redirect } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTeacherPermissions } from '@/hooks/useTeacherPermissions';
import { roleLabel } from '@/lib/format';
import { styles } from '@/lib/styles';

export default function TeacherProfileScreen() {
  const { role, user, branding, logout } = useAuth();
  const permissions = useTeacherPermissions();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: branding.primaryColor }]}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{user?.name}</Text>
        <Text style={styles.listRowSubtext}>{user?.email}</Text>
        <Text style={styles.studentMetaPill}>{roleLabel(role)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>School</Text>
        <Text style={styles.listRowSubtext}>{branding.schoolName}</Text>
      </View>

      {permissions.data?.hasCustomRole ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Custom Role Scope</Text>
          <Text style={styles.listRowSubtext}>
            {permissions.data.scope.unrestricted ? 'Unrestricted' : `${permissions.data.scope.sectionIds.length} section(s)`}
          </Text>
        </View>
      ) : null}

      <View style={[styles.card, styles.lastCard]}>
        <Pressable style={[styles.primaryButton, { backgroundColor: branding.primaryColor }]} onPress={logout}>
          <Text style={styles.primaryButtonText}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
