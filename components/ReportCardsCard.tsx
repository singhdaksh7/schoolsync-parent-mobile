import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import { formatDate } from '@/lib/format';
import { downloadAuthenticatedPdf, openOrSharePdf } from '@/lib/pdf-download';
import type { ReportCardItem } from '@/lib/types';
import { EmptyState } from './EmptyState';

/**
 * `pdfPathPrefix` differs by actor — Parent (`/api/parent/report-cards`) and
 * Student (`/api/student/report-cards`) each authenticate and scope the PDF
 * to their own linked/own student, so this card only needs the prefix, never
 * a raw shared URL. Omit `token`/`pdfPathPrefix` to keep the card read-only
 * (no download button) for a caller that has neither.
 */
export function ReportCardsCard({
  reportCards,
  token,
  pdfPathPrefix,
}: {
  reportCards: ReportCardItem[];
  token?: string | null;
  pdfPathPrefix?: string;
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const canDownload = Boolean(token && pdfPathPrefix);

  async function handleDownload(item: ReportCardItem) {
    if (!token || !pdfPathPrefix) return;
    setPdfError(null);
    setDownloadingId(item.id);
    try {
      const downloaded = await downloadAuthenticatedPdf(`${pdfPathPrefix}/${item.id}/pdf`, token, `report-card-${item.id}.pdf`);
      await openOrSharePdf(downloaded.uri);
      await downloaded.cleanup();
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Failed to download the report card PDF.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Published Report Cards</Text>
      {pdfError ? <Text style={styles.errorText}>{pdfError}</Text> : null}
      {reportCards.map((item) => (
        <View key={item.id} style={styles.listRow}>
          <View style={styles.listRowLeft}>
            <Text style={styles.listRowTitle}>{item.examScheme.name}</Text>
            <Text style={styles.listRowSubtext}>
              {item.student.name} - Roll {item.student.rollNo}
              {item.publishedAt ? ` - ${formatDate(item.publishedAt)}` : ''}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={styles.listRowValue}>
              {item.percentage}% - {item.grade}
            </Text>
            {canDownload ? (
              <Pressable style={styles.smallButton} onPress={() => handleDownload(item)} disabled={downloadingId === item.id}>
                {downloadingId === item.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallButtonText}>PDF</Text>}
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
      {reportCards.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No published report cards" message="Report cards will appear here once published." />
      ) : null}
    </View>
  );
}
