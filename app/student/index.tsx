import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { computeDashboardQuickActions } from '@/lib/student-portal-modules';
import { GlassSurface } from '@/components/GlassSurface';
import { LiquidBackground } from '@/components/LiquidBackground';
import { StudentTopBar } from '@/components/StudentTopBar';
import { StudentBottomNav } from '@/components/StudentBottomNav';
import { DashboardSkeleton } from '@/components/Skeleton';
import { Theme } from '@/constants/theme';
import { styles } from '@/lib/styles';

// Stitch "student-portal-dashboard" (Max Liquid Glass) rebuilt structurally:
// welcome header, 2 glass stat cards (Attendance/Homework), a 6-tile Quick
// Actions grid (computeDashboardQuickActions — the curated subset Stitch's
// Dashboard shows, distinct from the full 8-tile Menu grid on
// app/student/portal.tsx). Stitch's "Term Progress" section (Academic
// Standing %, Class Rank, Credits) is dropped entirely — none of those three
// values exist in the data model, and dropping just one field would have
// left the section holding nothing real, so the whole section goes rather
// than showing an empty shell.
export default function StudentScreen() {
  const { role, studentProfile, branding } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const dashboard = useStudentDashboard();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const firstName = (studentProfile?.name || 'Student').split(' ')[0];
  const initial = (studentProfile?.name || 'S').trim().charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const pendingHomework = dashboard.homework.filter((item) => item.submissionStatus === 'PENDING').length;
  const quickActions = computeDashboardQuickActions(hasFeature);
  const hasAnyData =
    dashboard.attendanceSummary !== null || dashboard.homework.length > 0 || dashboard.attendance.length > 0;

  return (
    <View style={styles.liquidScreen}>
      <LiquidBackground
        blobs={[
          { color: Theme.colors.primaryContainer, size: 220, top: -60, right: -60 },
          { color: Theme.colors.secondaryContainer, size: 180, bottom: 120, left: -80 },
        ]}
      />
      <StudentTopBar title="Dashboard" initial={initial} color={branding.primaryColor} />

      <ScrollView
        contentContainerStyle={styles.liquidScrollContent}
        refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
      >
        <Text style={styles.liquidWelcomeTitle}>Welcome back, {firstName}</Text>
        <View style={styles.liquidWelcomeSubtitle}>
          <Ionicons name="calendar-outline" size={14} color={Theme.colors.onSurfaceVariant} />
          <Text style={styles.liquidWelcomeSubtitleText}>{today}</Text>
        </View>

        {dashboard.error ? (
          <View style={[styles.inlineError, { marginHorizontal: 0, marginTop: 16 }]}>
            <Text style={styles.inlineErrorTitle}>Could not refresh dashboard</Text>
            <Text style={styles.inlineErrorText}>{dashboard.error}</Text>
          </View>
        ) : null}

        {dashboard.loading && !hasAnyData ? (
          <DashboardSkeleton />
        ) : (
          <>
            <View style={styles.liquidStatRow}>
              <GlassSurface style={styles.liquidStatCard}>
                <View style={styles.liquidStatHeaderRow}>
                  <Text style={styles.liquidStatLabel}>Attendance</Text>
                  <View style={[styles.liquidStatIconWrap, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="checkmark-circle" size={18} color={Theme.colors.success} />
                  </View>
                </View>
                <View>
                  <Text style={styles.liquidStatValue}>
                    {dashboard.attendanceSummary ? `${dashboard.attendanceSummary.percentage}%` : '—'}
                  </Text>
                  <Text style={styles.liquidStatSub}>Overall attendance</Text>
                </View>
              </GlassSurface>

              <GlassSurface style={styles.liquidStatCard}>
                <View style={styles.liquidStatHeaderRow}>
                  <Text style={styles.liquidStatLabel}>Homework</Text>
                  <View style={[styles.liquidStatIconWrap, { backgroundColor: Theme.colors.errorContainer }]}>
                    <Ionicons name="alert-circle" size={18} color={Theme.colors.error} />
                  </View>
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={styles.liquidStatValue}>{pendingHomework}</Text>
                    <Text style={[styles.liquidStatSub, { marginTop: 0 }]}>Pending</Text>
                  </View>
                </View>
              </GlassSurface>
            </View>

            <Text style={styles.liquidSectionTitle}>Quick Actions</Text>
            <View style={styles.liquidTileGrid}>
              {quickActions.map((module) => (
                <Pressable key={module.key} style={{ width: '47%' }} onPress={() => router.push(module.route as never)}>
                  <GlassSurface intensity={35} style={{ paddingVertical: Theme.spacing.lg, alignItems: 'center', gap: Theme.spacing.sm }}>
                    <View style={[styles.liquidTileIconWrap, { backgroundColor: branding.primaryColor + '1a' }]}>
                      <Ionicons name={module.icon as keyof typeof Ionicons.glyphMap} size={24} color={branding.primaryColor} />
                    </View>
                    <Text style={styles.liquidTileLabel}>{module.title}</Text>
                  </GlassSurface>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <StudentBottomNav active="home" color={branding.primaryColor} />
    </View>
  );
}
