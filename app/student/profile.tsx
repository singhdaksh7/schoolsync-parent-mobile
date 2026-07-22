import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { GlassSurface } from '@/components/GlassSurface';
import { LiquidBackground } from '@/components/LiquidBackground';
import { StudentTopBar } from '@/components/StudentTopBar';
import { StudentBottomNav } from '@/components/StudentBottomNav';
import { Theme } from '@/constants/theme';
import { styles } from '@/lib/styles';

// Stitch "student-portal-profile" rebuilt: bento identity card + Roll/
// Admission mini-stats, then an "Academic Overview" pair (Attendance %,
// Homework pending) using the same real data as the Dashboard's stat cards.
// Dropped entirely: GPA card (no gradePoint field anywhere), "Personal
// Details" list — DOB/Guardian Name/Contact Number/Blood Group/House Color
// have no backing fields on StudentUser, and "Download ID"/"View Files"
// buttons — no such functionality exists. Since every field in "Personal
// Details" was unbacked, the whole section is dropped rather than rendering
// an empty list.
export default function StudentProfileScreen() {
  const { role, studentProfile, studentSchool, branding } = useAuth();
  const dashboard = useStudentDashboard();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const className = studentProfile?.section?.class?.name;
  const sectionName = studentProfile?.section?.name;
  const classSection = className && sectionName ? `${className} - ${sectionName}` : className || sectionName || null;
  const initial = (studentProfile?.name || 'S').trim().charAt(0).toUpperCase();
  const pendingHomework = dashboard.homework.filter((item) => item.submissionStatus === 'PENDING').length;

  return (
    <View style={styles.liquidScreen}>
      <LiquidBackground
        blobs={[
          { color: Theme.colors.primaryContainer, size: 220, top: -60, right: -60 },
          { color: Theme.colors.secondaryContainer, size: 160, bottom: 60, left: -80 },
        ]}
      />
      <StudentTopBar title="Profile" onBack={() => router.back()} color={branding.primaryColor} />

      <ScrollView contentContainerStyle={styles.liquidScrollContent}>
        <GlassSurface style={{ padding: Theme.spacing.lg }} glow>
          <View style={{ alignItems: 'center', gap: Theme.spacing.sm }}>
            <View style={[styles.liquidProfileAvatar, { width: 96, height: 96, borderRadius: 48, backgroundColor: branding.primaryColor }]}>
              <Text style={[styles.liquidProfileAvatarText, { fontSize: 32 }]}>{initial}</Text>
            </View>
            <View style={styles.liquidActiveBadge}>
              <View style={styles.liquidActiveBadgeDot} />
              <Text style={styles.liquidActiveBadgeText}>Active Student</Text>
            </View>
            <Text style={[styles.studentName, { fontSize: 20 }]}>{studentProfile?.name || 'Student'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="school-outline" size={16} color={Theme.colors.onSurfaceVariant} />
              <Text style={styles.studentClassLine}>{classSection || 'Class & section not provided'}</Text>
            </View>
            <Text style={styles.studentSchool}>{studentSchool?.name || 'School'}</Text>
          </View>
        </GlassSurface>

        <View style={styles.liquidMiniStatRow}>
          <GlassSurface style={[styles.liquidMiniStat, { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm }]} intensity={35}>
            <View style={[styles.liquidTileIconWrap, { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.colors.secondaryContainer + '33' }]}>
              <Ionicons name="pricetag-outline" size={18} color={Theme.colors.secondary} />
            </View>
            <View>
              <Text style={styles.liquidMiniStatLabel}>Roll No.</Text>
              <Text style={styles.liquidMiniStatValue}>{studentProfile?.rollNo || '—'}</Text>
            </View>
          </GlassSurface>
          <GlassSurface style={[styles.liquidMiniStat, { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm }]} intensity={35}>
            <View style={[styles.liquidTileIconWrap, { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.colors.tertiary + '22' }]}>
              <Ionicons name="finger-print-outline" size={18} color={Theme.colors.tertiary} />
            </View>
            <View>
              <Text style={styles.liquidMiniStatLabel}>Admission No.</Text>
              <Text style={styles.liquidMiniStatValue}>{studentProfile?.admissionNo || '—'}</Text>
            </View>
          </GlassSurface>
        </View>

        <Text style={styles.liquidSectionTitle}>Academic Overview</Text>
        <View style={styles.liquidStatRow}>
          <GlassSurface style={styles.liquidStatCard}>
            <View style={styles.liquidStatHeaderRow}>
              <Text style={styles.liquidStatLabel}>Attendance</Text>
              {dashboard.attendanceSummary ? (
                <View style={[styles.liquidStatIconWrap, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="checkmark-circle" size={18} color={Theme.colors.success} />
                </View>
              ) : null}
            </View>
            <Text style={styles.liquidStatValue}>{dashboard.attendanceSummary ? `${dashboard.attendanceSummary.percentage}%` : '—'}</Text>
          </GlassSurface>
          <GlassSurface style={styles.liquidStatCard}>
            <View style={styles.liquidStatHeaderRow}>
              <Text style={styles.liquidStatLabel}>Homework</Text>
              <View style={[styles.liquidStatIconWrap, { backgroundColor: Theme.colors.errorContainer }]}>
                <Ionicons name="alert-circle" size={18} color={Theme.colors.error} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={styles.liquidStatValue}>{pendingHomework}</Text>
              <Text style={[styles.liquidStatSub, { marginTop: 0 }]}>Pending</Text>
            </View>
          </GlassSurface>
        </View>

        {studentProfile?.email ? (
          <GlassSurface style={{ padding: Theme.spacing.lg, marginTop: Theme.spacing.xl }}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.listRowSubtext}>{studentProfile.email}</Text>
          </GlassSurface>
        ) : null}
      </ScrollView>

      <StudentBottomNav active="academic" color={branding.primaryColor} />
    </View>
  );
}
