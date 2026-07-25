import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useTeacherPermissions } from '@/hooks/useTeacherPermissions';
import { useTeacherReportCards } from '@/hooks/useTeacherReportCards';
import { can } from '@/lib/teacher-permissions';
import { downloadAuthenticatedPdf, openOrSharePdf } from '@/lib/pdf-download';
import { formatDate } from '@/lib/format';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

export default function TeacherReportCardsScreen() {
  const { role, token } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const permissions = useTeacherPermissions();
  const reportCards = useTeacherReportCards();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const sectionId = reportCards.mentorSection?.id ?? undefined;
  const canView = can(permissions.data, 'REPORT_CARDS', 'VIEW', { sectionId });
  const canGenerate = can(permissions.data, 'REPORT_CARDS', 'GENERATE', { sectionId });
  const canPublish = can(permissions.data, 'REPORT_CARDS', 'PUBLISH', { sectionId });
  const canDownload = can(permissions.data, 'REPORT_CARDS', 'DOWNLOAD', { sectionId });

  async function handleGenerate(examSchemeId: string) {
    await reportCards.generate(examSchemeId);
  }

  async function handleDownload(id: string) {
    if (!token) return;
    setPdfError(null);
    setDownloadingId(id);
    try {
      const downloaded = await downloadAuthenticatedPdf(`/api/teacher/report-cards/${id}/pdf`, token, `report-card-${id}.pdf`);
      await openOrSharePdf(downloaded.uri);
      await downloaded.cleanup();
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Failed to download the report card PDF.');
    } finally {
      setDownloadingId(null);
    }
  }

  if (!hasFeature('REPORT_CARDS')) {
    return (
      <View style={styles.teacherScreen}>
        <View style={styles.teacherHeader}>
          <Text style={styles.teacherHeaderTitle}>Report Cards</Text>
        </View>
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>Report Cards are not enabled for your school.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.teacherScreen}
      refreshControl={<RefreshControl refreshing={reportCards.refreshing} onRefresh={reportCards.handleRefresh} />}
    >
      <View style={styles.teacherHeader}>
        <Text style={styles.teacherHeaderTitle}>Report Cards</Text>
      </View>

      {reportCards.error ? <Text style={styles.errorBanner}>{reportCards.error}</Text> : null}
      {pdfError ? <Text style={styles.errorBanner}>{pdfError}</Text> : null}

      {reportCards.activeJob ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorTitle}>
            Generating report cards{reportCards.activeJob.deduplicated ? ' (already in progress)' : ''} — {reportCards.activeJob.totalItems} student(s).
          </Text>
          {reportCards.jobStatus ? (
            <Text style={styles.inlineErrorText}>
              {reportCards.jobStatus.status === 'PENDING' ? 'Queued' : 'Running'} · {reportCards.jobStatus.processedItems ?? 0}/
              {reportCards.jobStatus.totalItems} processed
              {reportCards.jobStatus.failedItems ? ` · ${reportCards.jobStatus.failedItems} failed` : ''}
            </Text>
          ) : (
            <Text style={styles.inlineErrorText}>Checking status…</Text>
          )}
          <Pressable style={[styles.smallButton, { backgroundColor: tc.secondary }]} onPress={reportCards.dismissActiveJob}>
            <Text style={styles.smallButtonText}>Dismiss</Text>
          </Pressable>
        </View>
      ) : null}

      {!reportCards.mentorSection ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>Only class mentors can generate report cards.</Text>
        </View>
      ) : !canView ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>You do not have permission to view report cards.</Text>
        </View>
      ) : (
        <>
          {canGenerate ? (
            <View style={styles.teacherCard}>
              <Text style={styles.teacherSectionTitle}>Generate</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {reportCards.schemes.map((scheme) => (
                  <Pressable
                    key={scheme.id}
                    style={styles.childChip}
                    onPress={() => handleGenerate(scheme.id)}
                    disabled={reportCards.generating}
                  >
                    <Text style={styles.childChipText}>{scheme.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              {reportCards.generating ? <ActivityIndicator color={tc.primary} /> : null}
              {reportCards.schemes.length === 0 ? <Text style={styles.teacherEmptyText}>No exam schemes available.</Text> : null}
            </View>
          ) : null}

          {reportCards.reportCards.map((card) => (
            <View key={card.id} style={styles.teacherCard}>
              <View style={styles.teacherCardHeaderRow}>
                <Text style={styles.teacherListRowTitle}>{card.student.name}</Text>
                <Text style={[styles.teacherPill, card.status === 'PUBLISHED' ? styles.teacherPillPresent : styles.teacherPillMuted]}>{card.status}</Text>
              </View>
              <Text style={styles.teacherListRowSubtext}>
                Roll {card.student.rollNo} · {card.examScheme.name} · {card.percentage}% · {card.grade}
              </Text>
              {card.publishedAt ? <Text style={styles.teacherMeta}>Published {formatDate(card.publishedAt)}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {canPublish && card.status !== 'PUBLISHED' ? (
                  <Pressable style={[styles.smallButton, { backgroundColor: tc.secondary }]} onPress={() => reportCards.publish(card.id)} disabled={reportCards.publishingId === card.id}>
                    {reportCards.publishingId === card.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.smallButtonText}>Publish</Text>
                    )}
                  </Pressable>
                ) : null}
                {canDownload ? (
                  <Pressable style={[styles.smallButton, { backgroundColor: tc.secondary }]} onPress={() => handleDownload(card.id)} disabled={downloadingId === card.id}>
                    {downloadingId === card.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallButtonText}>PDF</Text>}
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}

          {reportCards.reportCards.length === 0 && !reportCards.loading ? (
            <View style={[styles.teacherCard, styles.teacherLastCard]}>
              <Text style={styles.teacherEmptyText}>No report cards generated yet.</Text>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
