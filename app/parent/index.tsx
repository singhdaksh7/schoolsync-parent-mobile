import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { PortalGrid } from '@/components/PortalGrid';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { computeVisibleParentPortalModules } from '@/lib/parent-portal-modules';
import { styles } from '@/lib/styles';

// Grid-menu landing screen for the Parent Portal — mirrors the Student
// Portal grid built in PR #2 (see lib/student-portal-modules.ts) via the
// shared PortalGrid component. Only surfaces tiles backed by a real Parent
// API route; see lib/parent-portal-modules.ts for the (unit-tested)
// visibility rule and a note on what was dropped for having no real backing
// endpoint (Leave, Profile).
export default function ParentScreen() {
  const { role, branding, logout } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const dashboard = useParentDashboard();
  const router = useRouter();

  if (role !== 'PARENT') return <Redirect href="/" />;

  const modules = computeVisibleParentPortalModules(hasFeature);

  return (
    <PortalGrid
      title="Parent Portal"
      color={branding.primaryColor}
      modules={modules}
      onNavigate={(route) => router.push(route as never)}
      onSearch={() => router.push('/parent/portal-search')}
      onLogout={logout}
      refreshing={dashboard.refreshing}
      onRefresh={dashboard.handleRefresh}
      header={
        <View style={[styles.card, { marginBottom: 0 }]}>
          <Text style={styles.sectionTitle}>Children</Text>
          {dashboard.children.length === 0 ? (
            <Text style={styles.emptyText}>No linked students found for this account.</Text>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dashboard.children.map((child) => {
              const isSelected = dashboard.selectedStudentId === child.id;
              return (
                <Pressable
                  key={child.id}
                  style={[styles.childChip, isSelected && { borderColor: branding.primaryColor, backgroundColor: '#eef6ff' }]}
                  onPress={() => dashboard.handleChildChange(child.id)}
                >
                  <Text style={[styles.childChipText, isSelected && { color: branding.primaryColor }]}>{child.name}</Text>
                  <Text style={styles.childChipSubtext}>
                    Roll {child.rollNo}
                    {child.section?.class?.name && child.section?.name ? ` - ${child.section.class.name}-${child.section.name}` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {dashboard.error ? <Text style={[styles.inlineErrorText, { marginTop: 8 }]}>{dashboard.error}</Text> : null}
        </View>
      }
    />
  );
}
