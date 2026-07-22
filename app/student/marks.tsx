import React, { useMemo } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { GlassSurface } from '@/components/GlassSurface';
import { LiquidBackground } from '@/components/LiquidBackground';
import { StudentTopBar } from '@/components/StudentTopBar';
import { StudentBottomNav } from '@/components/StudentBottomNav';
import { CardSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { Theme } from '@/constants/theme';
import { styles } from '@/lib/styles';
import type { MarkItem } from '@/lib/types';

const GROUP_COLORS = [Theme.colors.primary, Theme.colors.secondary, Theme.colors.tertiary];

// Stitch "student-portal-examination-marks" rebuilt: grouped-by-exam-scheme
// sections (a real field — MarkItem.exam.scheme.name) each with a header and
// rows showing "Obtained X/Y" + a circular grade-pill. Dropped entirely (no
// backing field for any of them): the CGPA/Percentile/Credits/Rank 4-stat
// row, per-group weighting %, the bar-chart "Grade Distribution", and the
// "Top 5% / Dean's List" achievement card with its Download button.
export default function StudentMarksScreen() {
  const { role, branding } = useAuth();
  const dashboard = useStudentDashboard();
  const router = useRouter();

  const groups = useMemo(() => {
    const map = new Map<string, MarkItem[]>();
    for (const item of dashboard.marks) {
      const key = item.exam.scheme?.name || 'Exams';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [dashboard.marks]);

  if (role !== 'STUDENT') return <Redirect href="/" />;

  return (
    <View style={styles.liquidScreen}>
      <LiquidBackground
        blobs={[
          { color: Theme.colors.primaryContainer, size: 200, top: -60, right: -60 },
          { color: Theme.colors.secondaryContainer, size: 160, bottom: 100, left: -80 },
        ]}
      />
      <StudentTopBar title="Marks" onBack={() => router.back()} color={branding.primaryColor} />

      <ScrollView
        contentContainerStyle={styles.liquidScrollContent}
        refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
      >
        {dashboard.loading && dashboard.marks.length === 0 ? (
          <CardSkeleton rows={5} />
        ) : dashboard.marks.length === 0 ? (
          <EmptyState icon="school-outline" title="No marks published yet" message="Exam results will appear here once published." />
        ) : (
          groups.map(([schemeName, items], groupIndex) => {
            const color = GROUP_COLORS[groupIndex % GROUP_COLORS.length];
            return (
              <View key={schemeName} style={{ marginBottom: Theme.spacing.lg }}>
                <GlassSurface style={styles.liquidGroupHeader} intensity={45}>
                  <View style={styles.liquidGroupHeaderTitle}>
                    <Ionicons name="star" size={18} color={color} />
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{schemeName}</Text>
                  </View>
                </GlassSurface>
                {items.map((item) => (
                  <GlassSurface key={item.id} style={styles.liquidMarkRow} intensity={30}>
                    <View style={[styles.liquidMarkIconWrap, { backgroundColor: color + '1a' }]}>
                      <Ionicons name="book-outline" size={20} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listRowTitle}>{item.exam.name}</Text>
                      <Text style={styles.listRowSubtext}>
                        Obtained {item.marks} <Text style={{ opacity: 0.6 }}>/ {item.exam.maxMarks}</Text>
                      </Text>
                    </View>
                    {item.grade ? (
                      <View style={[styles.liquidGradePill, { borderColor: color + '33', backgroundColor: color + '0d' }]}>
                        <Text style={{ color, fontWeight: '800', fontSize: 16 }}>{item.grade}</Text>
                      </View>
                    ) : null}
                  </GlassSurface>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      <StudentBottomNav active="academic" color={branding.primaryColor} />
    </View>
  );
}
