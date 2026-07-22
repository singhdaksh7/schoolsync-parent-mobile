import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { computeVisibleStudentPortalModules } from '@/lib/student-portal-modules';
import { GlassSurface } from '@/components/GlassSurface';
import { LiquidBackground } from '@/components/LiquidBackground';
import { StudentTopBar } from '@/components/StudentTopBar';
import { StudentBottomNav } from '@/components/StudentBottomNav';
import { Theme } from '@/constants/theme';
import { styles } from '@/lib/styles';

// Stitch "student-portal-menu": a full-screen glass panel — mini-profile
// header, 2-col 8-tile module grid (all modules, unlike the Dashboard's
// curated 6), footer Logout. Stitch renders this as a modal overlaid on a
// blurred dashboard; Expo Router's Stack fully replaces the previous screen
// on push (nothing renders "behind" a pushed screen), so the overlay effect
// itself isn't reproducible — implemented as a normal full screen with the
// same glass panel content instead, which is the closest faithful
// equivalent for a push-based navigator.
export default function StudentPortalScreen() {
  const { role, studentProfile, branding, logout } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const modules = computeVisibleStudentPortalModules(hasFeature);
  const initial = (studentProfile?.name || 'S').trim().charAt(0).toUpperCase();
  const className = studentProfile?.section?.class?.name;
  const sectionName = studentProfile?.section?.name;
  const classSection = className && sectionName ? `${className} - ${sectionName}` : className || sectionName || null;

  return (
    <View style={styles.liquidScreen}>
      <LiquidBackground
        blobs={[
          { color: Theme.colors.primaryContainer, size: 200, top: -60, left: -60 },
          { color: Theme.colors.secondaryContainer, size: 160, bottom: -40, right: -60 },
        ]}
      />
      <StudentTopBar title="Menu" onBack={() => router.back()} color={branding.primaryColor} />

      <ScrollView contentContainerStyle={styles.liquidScrollContent}>
        <GlassSurface style={{ padding: Theme.spacing.lg, marginBottom: Theme.spacing.xl }} glow>
          <View style={styles.liquidCardRow}>
            <View style={[styles.liquidProfileAvatar, { backgroundColor: branding.primaryColor }]}>
              <Text style={styles.liquidProfileAvatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{studentProfile?.name || 'Student'}</Text>
              <Text style={styles.studentClassLine}>{classSection || 'Class & section not provided'}</Text>
              <View style={styles.liquidActiveBadge}>
                <View style={styles.liquidActiveBadgeDot} />
                <Text style={styles.liquidActiveBadgeText}>Active Student</Text>
              </View>
            </View>
          </View>
        </GlassSurface>

        <View style={styles.liquidTileGrid}>
          {modules.map((module) => (
            <Pressable key={module.key} style={{ width: '47%' }} onPress={() => router.push(module.route as never)}>
              <GlassSurface intensity={35} style={{ aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: Theme.spacing.sm }}>
                <View style={[styles.liquidTileIconWrap, { backgroundColor: branding.primaryColor + '1a' }]}>
                  <Ionicons name={module.icon as keyof typeof Ionicons.glyphMap} size={24} color={branding.primaryColor} />
                </View>
                <Text style={styles.liquidTileLabel}>{module.title}</Text>
              </GlassSurface>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: Theme.colors.errorContainer, marginTop: Theme.spacing.xl }]}
          onPress={logout}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="log-out-outline" size={18} color={Theme.colors.error} />
            <Text style={{ color: Theme.colors.error, fontWeight: '700' }}>Logout</Text>
          </View>
        </Pressable>
      </ScrollView>

      <StudentBottomNav active="menu" color={branding.primaryColor} />
    </View>
  );
}
