import React, { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { downloadAuthenticatedPdf, openOrSharePdf } from '@/lib/pdf-download';
import { GlassSurface } from '@/components/GlassSurface';
import { LiquidBackground } from '@/components/LiquidBackground';
import { StudentTopBar } from '@/components/StudentTopBar';
import { StudentBottomNav } from '@/components/StudentBottomNav';
import { CardSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/format';
import { Theme } from '@/constants/theme';
import { styles } from '@/lib/styles';

// Stitch "student-portal-report-cards" rebuilt as a stacked card list (the
// Stitch source is `grid-cols-1 md:grid-cols-2` — 1 column at mobile widths,
// which is what this actually renders as, matching the real breakpoint
// rather than the desktop 2-up screenshot). Each card: title (examScheme
// name — real), grade letter (real), 2-col mini-stats (Aggregate % = real
// percentage, Issue Date = real publishedAt), Download button (existing PDF
// flow). Dropped: "Grade Point" 4.0-scale number (no such field —
// ReportCardItem.grade is a letter string), the term-type pill ("Final
// Term"/"Mid Term" — no such categorization field, and pattern-matching it
// out of examScheme's name would be inventing data), the dashed "Upcoming"
// placeholder card (fabricated), the academic-year filter chip (no year
// field to filter by), and the FAB print button (no print functionality).
export default function StudentReportCardsScreen() {
  const { role, branding, token } = useAuth();
  const dashboard = useStudentDashboard();
  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  if (role !== 'STUDENT') return <Redirect href="/" />;

  async function handleDownload(id: string) {
    if (!token) return;
    setPdfError(null);
    setDownloadingId(id);
    try {
      const downloaded = await downloadAuthenticatedPdf(`/api/student/report-cards/${id}/pdf`, token, `report-card-${id}.pdf`);
      await openOrSharePdf(downloaded.uri);
      await downloaded.cleanup();
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Failed to download the report card PDF.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <View style={styles.liquidScreen}>
      <LiquidBackground
        blobs={[
          { color: Theme.colors.primaryContainer, size: 200, top: -60, right: -60 },
          { color: Theme.colors.secondaryContainer, size: 160, bottom: 100, left: -80 },
        ]}
      />
      <StudentTopBar title="Report Cards" onBack={() => router.back()} color={branding.primaryColor} />

      <ScrollView
        contentContainerStyle={styles.liquidScrollContent}
        refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
      >
        {pdfError ? <Text style={[styles.errorText, { marginBottom: Theme.spacing.md }]}>{pdfError}</Text> : null}

        {dashboard.loading && dashboard.reportCards.length === 0 ? (
          <CardSkeleton rows={4} />
        ) : dashboard.reportCards.length === 0 ? (
          <EmptyState icon="document-text-outline" title="No published report cards" message="Report cards will appear here once published." />
        ) : (
          dashboard.reportCards.map((item) => (
            <GlassSurface key={item.id} style={styles.liquidReportCard} glow>
              <View style={styles.liquidReportTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>{item.examScheme.name}</Text>
                  <Text style={styles.listRowSubtext}>
                    {item.student.name} · Roll {item.student.rollNo}
                  </Text>
                </View>
                <Text style={[styles.liquidReportGradeText, { color: branding.primaryColor }]}>{item.grade}</Text>
              </View>

              <View style={styles.liquidReportStatGrid}>
                <View style={styles.liquidReportStatBox}>
                  <Text style={styles.liquidMiniStatLabel}>Aggregate</Text>
                  <Text style={styles.liquidMiniStatValue}>{item.percentage}%</Text>
                </View>
                <View style={styles.liquidReportStatBox}>
                  <Text style={styles.liquidMiniStatLabel}>Issue Date</Text>
                  <Text style={[styles.listRowTitle, { marginTop: 4 }]}>{item.publishedAt ? formatDate(item.publishedAt) : '—'}</Text>
                </View>
              </View>

              <Pressable
                style={[styles.primaryButton, { backgroundColor: branding.primaryColor, marginTop: 0 }]}
                onPress={() => handleDownload(item.id)}
                disabled={downloadingId === item.id}
              >
                {downloadingId === item.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="download-outline" size={16} color="#fff" />
                    <Text style={styles.primaryButtonText}>Download PDF Report</Text>
                  </View>
                )}
              </Pressable>
            </GlassSurface>
          ))
        )}
      </ScrollView>

      <StudentBottomNav active="academic" color={branding.primaryColor} />
    </View>
  );
}
