import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { computeVisibleStudentPortalModules } from '@/lib/student-portal-modules';
import { styles } from '@/lib/styles';

// Grid-menu entry point into the Student Portal (Profile/Timetable/
// Attendance/Marks/Report Cards/Announcements). Only surfaces tiles that are
// (a) backed by a real Student API route and (b) feature-enabled for the
// school — see lib/student-portal-modules.ts for the (unit-tested)
// visibility rule and a note on which reference-design menu items were
// dropped for having no real backing endpoint.
export default function StudentPortalScreen() {
  const { role, branding, logout } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const modules = computeVisibleStudentPortalModules(hasFeature);

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.subScreenHeader, { backgroundColor: branding.primaryColor }]}>
        {/* No side-drawer navigation exists in this app yet. Until one is
            built, the menu icon just returns to the main dashboard rather
            than guessing at a destination that doesn't exist. */}
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="menu" size={24} color="#fff" />
        </Pressable>
        <Text style={[styles.subScreenHeaderTitle, { textAlign: 'center' }]}>Student Portal</Text>
        <View style={styles.subScreenHeaderActions}>
          <Pressable onPress={() => router.push('/student/portal-search')} hitSlop={10}>
            <Ionicons name="search" size={22} color="#fff" />
          </Pressable>
          <Pressable onPress={logout} hitSlop={10}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.portalGrid}>
        {modules.map((module) => (
          <Pressable key={module.key} style={styles.portalTile} onPress={() => router.push(module.route)}>
            <View style={[styles.portalTileBadge, { backgroundColor: branding.primaryColor }]}>
              <Ionicons name={module.icon as keyof typeof Ionicons.glyphMap} size={26} color="#fff" />
            </View>
            <Text style={styles.portalTileLabel}>{module.title}</Text>
          </Pressable>
        ))}

        <Pressable key="logout" style={styles.portalTile} onPress={logout}>
          <View style={[styles.portalTileBadge, { backgroundColor: branding.primaryColor }]}>
            <Ionicons name="log-out-outline" size={26} color="#fff" />
          </View>
          <Text style={styles.portalTileLabel}>Logout</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
