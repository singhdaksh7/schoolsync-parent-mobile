import React, { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { GlassSurface } from '@/components/GlassSurface';
import { LiquidBackground } from '@/components/LiquidBackground';
import { StudentTopBar } from '@/components/StudentTopBar';
import { StudentBottomNav } from '@/components/StudentBottomNav';
import { CardSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatStatus } from '@/lib/format';
import { Theme } from '@/constants/theme';
import { styles } from '@/lib/styles';

const STATUS_COLOR: Record<string, string> = {
  PRESENT: Theme.colors.success,
  ABSENT: Theme.colors.error,
  LATE: Theme.colors.warning,
};

const PAGE_SIZE = 8;

// Stitch "student-portal-attendance" rebuilt: bento hero (Overall % + real
// Present/Absent/Late counts) + "Recent Activity" list with date-box tiles.
// Dropped: month-over-month trend ("+1.2% vs last month" — no historical
// comparison endpoint), check-in time-of-day (AttendanceItem has no
// timestamp, only a date), and synthetic weekend/"School Closed" rows (there
// is no school-calendar data to know which days are non-school days — only
// real records are rendered). "Show older records" pages through the
// already-fetched list client-side, not a new endpoint.
export default function StudentAttendanceScreen() {
  const { role, branding } = useAuth();
  const dashboard = useStudentDashboard();
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const summary = dashboard.attendanceSummary;
  const sorted = [...dashboard.attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const visible = sorted.slice(0, visibleCount);

  return (
    <View style={styles.liquidScreen}>
      <LiquidBackground
        blobs={[
          { color: Theme.colors.primaryContainer, size: 200, top: -60, right: -60 },
          { color: Theme.colors.secondaryContainer, size: 160, bottom: 100, left: -80 },
        ]}
      />
      <StudentTopBar title="Attendance" onBack={() => router.back()} color={branding.primaryColor} />

      <ScrollView
        contentContainerStyle={styles.liquidScrollContent}
        refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
      >
        {dashboard.loading && dashboard.attendance.length === 0 ? (
          <CardSkeleton rows={5} />
        ) : (
          <>
            <GlassSurface style={styles.liquidHeroCard} glow>
              <View>
                <Text style={styles.liquidHeroLabel}>Overall Attendance</Text>
              </View>
              <Text style={styles.liquidHeroValue}>{summary ? `${summary.percentage}%` : '—'}</Text>
            </GlassSurface>

            <View style={styles.liquidMiniStatRow}>
              <GlassSurface style={styles.liquidMiniStat} intensity={35}>
                <Text style={styles.liquidMiniStatLabel}>Present</Text>
                <Text style={[styles.liquidMiniStatValue, { color: Theme.colors.success }]}>{summary?.present ?? 0}</Text>
              </GlassSurface>
              <GlassSurface style={styles.liquidMiniStat} intensity={35}>
                <Text style={styles.liquidMiniStatLabel}>Absent</Text>
                <Text style={[styles.liquidMiniStatValue, { color: Theme.colors.error }]}>{summary?.absent ?? 0}</Text>
              </GlassSurface>
              <GlassSurface style={styles.liquidMiniStat} intensity={35}>
                <Text style={styles.liquidMiniStatLabel}>Late</Text>
                <Text style={[styles.liquidMiniStatValue, { color: Theme.colors.warning }]}>{summary?.late ?? 0}</Text>
              </GlassSurface>
            </View>

            <Text style={styles.liquidSectionTitle}>Recent Activity</Text>
            {sorted.length === 0 ? (
              <EmptyState icon="checkmark-done-outline" title="No attendance records" message="Records will appear here once marked." />
            ) : (
              <GlassSurface style={{ padding: Theme.spacing.md }}>
                {visible.map((item) => {
                  const date = new Date(item.date);
                  const color = STATUS_COLOR[item.status] || Theme.colors.onSurfaceVariant;
                  return (
                    <View key={item.id} style={styles.liquidActivityRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md }}>
                        <View style={styles.liquidDateTile}>
                          <Text style={styles.liquidDateTileMonth}>
                            {date.toLocaleDateString(undefined, { month: 'short' })}
                          </Text>
                          <Text style={styles.liquidDateTileDay}>{date.getDate()}</Text>
                        </View>
                        <Text style={styles.listRowTitle}>{date.toLocaleDateString(undefined, { weekday: 'long' })}</Text>
                      </View>
                      <View style={[styles.liquidStatusDotPill, { borderColor: color + '33', backgroundColor: color + '1a' }]}>
                        <View style={[styles.liquidStatusDot, { backgroundColor: color }]} />
                        <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{formatStatus(item.status)}</Text>
                      </View>
                    </View>
                  );
                })}
                {visibleCount < sorted.length ? (
                  <Pressable onPress={() => setVisibleCount((c) => c + PAGE_SIZE)} style={{ paddingVertical: Theme.spacing.md, alignItems: 'center' }}>
                    <Text style={{ color: branding.primaryColor, fontWeight: '700' }}>Show older records</Text>
                  </Pressable>
                ) : null}
              </GlassSurface>
            )}
          </>
        )}
      </ScrollView>

      <StudentBottomNav active="academic" color={branding.primaryColor} />
    </View>
  );
}
