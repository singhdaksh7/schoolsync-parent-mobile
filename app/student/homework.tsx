import React from 'react';
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
import { formatDateTime } from '@/lib/format';
import { Theme } from '@/constants/theme';
import { styles } from '@/lib/styles';

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  PENDING: { bg: Theme.colors.warningContainer, fg: Theme.colors.warning, label: 'Pending' },
  SUBMITTED: { bg: Theme.colors.secondaryContainer + '33', fg: Theme.colors.secondary, label: 'Submitted' },
  LATE_SUBMITTED: { bg: Theme.colors.errorContainer, fg: Theme.colors.error, label: 'Late' },
  NOT_SUBMITTED: { bg: Theme.colors.errorContainer, fg: Theme.colors.error, label: 'Not Submitted' },
  CHECKED: { bg: Theme.colors.successContainer, fg: Theme.colors.success, label: 'Checked' },
  REJECTED: { bg: Theme.colors.errorContainer, fg: Theme.colors.error, label: 'Rejected' },
};

// Stitch "student-portal-homework" given its own route (previously rendered
// inline on the dashboard with no route of its own). List rows: subject +
// colored status chip (real submissionStatus), title, a status-dependent
// meta line (score for CHECKED, submitted time for SUBMITTED/LATE_SUBMITTED,
// due date otherwise — all real fields), and a highlighted remark callout
// for CHECKED items (real teacherRemark). Dropped: the "92% Average Score"
// stat (no aggregate-score endpoint), the filter/sort icons (decorative,
// wire to nothing), and teacher name in the meta row — HomeworkItem has no
// teacher field. The 4-tile bento header is simplified to one real stat
// (Active count, from homeworkStatus) since "Average Score" had no data to
// pair it with.
export default function StudentHomeworkScreen() {
  const { role, branding } = useAuth();
  const dashboard = useStudentDashboard();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const activeCount = dashboard.homework.filter((item) => item.homeworkStatus === 'ACTIVE').length;

  return (
    <View style={styles.liquidScreen}>
      <LiquidBackground
        blobs={[
          { color: Theme.colors.primaryContainer, size: 200, top: -60, right: -60 },
          { color: Theme.colors.secondaryContainer, size: 160, bottom: 100, left: -80 },
        ]}
      />
      <StudentTopBar title="Homework" onBack={() => router.back()} color={branding.primaryColor} />

      <ScrollView
        contentContainerStyle={styles.liquidScrollContent}
        refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
      >
        {dashboard.loading && dashboard.homework.length === 0 ? (
          <CardSkeleton rows={4} />
        ) : dashboard.homework.length === 0 ? (
          <EmptyState icon="document-text-outline" title="No homework assigned" message="New assignments will show up here." />
        ) : (
          <>
            <GlassSurface style={[styles.liquidStatCard, { marginBottom: Theme.spacing.lg }]} intensity={35}>
              <Text style={styles.liquidStatLabel}>Active Assignments</Text>
              <Text style={styles.liquidStatValue}>{activeCount}</Text>
            </GlassSurface>

            {dashboard.homework.map((item) => {
              const statusStyle = STATUS_STYLE[item.submissionStatus] || STATUS_STYLE.PENDING;
              return (
                <GlassSurface key={item.id} style={styles.liquidHomeworkRow} intensity={30}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={[styles.liquidStatLabel, { fontSize: 11 }]}>{item.subject}</Text>
                    <View style={[styles.liquidStatusChip, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.liquidStatusChipText, { color: statusStyle.fg }]}>{statusStyle.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.listRowTitle}>{item.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    {item.submissionStatus === 'CHECKED' && item.score !== null ? (
                      <>
                        <Ionicons name="ribbon-outline" size={14} color={branding.primaryColor} />
                        <Text style={[styles.listRowSubtext, { color: branding.primaryColor, fontWeight: '700' }]}>
                          Score: {item.score}/{item.maxScore}
                        </Text>
                      </>
                    ) : item.submittedAt ? (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={14} color={Theme.colors.onSurfaceVariant} />
                        <Text style={styles.listRowSubtext}>Submitted {formatDateTime(item.submittedAt)}</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="calendar-outline" size={14} color={Theme.colors.onSurfaceVariant} />
                        <Text style={styles.listRowSubtext}>Due {formatDateTime(item.deadlineAt)}</Text>
                      </>
                    )}
                  </View>

                  {item.submissionStatus === 'CHECKED' && item.teacherRemark ? (
                    <View style={[styles.liquidRemarkCallout, { backgroundColor: branding.primaryColor + '0d', borderLeftColor: branding.primaryColor }]}>
                      <Ionicons name="chatbubble-outline" size={16} color={branding.primaryColor} />
                      <Text style={[styles.remarkText, { flex: 1, marginTop: 0 }]}>{item.teacherRemark}</Text>
                    </View>
                  ) : null}
                </GlassSurface>
              );
            })}
          </>
        )}
      </ScrollView>

      <StudentBottomNav active="academic" color={branding.primaryColor} />
    </View>
  );
}
