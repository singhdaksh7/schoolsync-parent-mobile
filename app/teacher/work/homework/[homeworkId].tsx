import React, { useMemo, useState } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useHomeworkClassDashboard } from '@/hooks/useHomeworkClassDashboard';
import { useTeacherHomework } from '@/hooks/useTeacherHomework';
import { useTeacherPermissions } from '@/hooks/useTeacherPermissions';
import { useTeacherSubmissions } from '@/hooks/useTeacherSubmissions';
import { can } from '@/lib/teacher-permissions';
import { formatDateTime, formatStatus } from '@/lib/format';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

export default function TeacherHomeworkDetailScreen() {
  const { homeworkId } = useLocalSearchParams<{ homeworkId: string }>();
  const { role } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const permissions = useTeacherPermissions();
  const homeworkActions = useTeacherHomework();
  const submissionsHook = useTeacherSubmissions(homeworkId);
  const dashboard = useHomeworkClassDashboard(submissionsHook.homework?.section.id ?? null, submissionsHook.homework?.subject ?? null);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, { score: string; maxScore: string; teacherRemark: string }>>({});
  const unsubmittedStudentIds = useMemo(
    () => submissionsHook.submissions.filter((s) => s.submissionStatus === 'PENDING').map((s) => s.studentId),
    [submissionsHook.submissions]
  );

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const homework = submissionsHook.homework;
  const canEdit = homework ? can(permissions.data, 'HOMEWORK', 'EDIT', { sectionId: homework.section.id }) : true;
  const canReview = homework ? can(permissions.data, 'HOMEWORK', 'REVIEW', { sectionId: homework.section.id }) : true;
  const pastDeadline = homework ? new Date() > new Date(homework.deadlineAt) : false;

  function startEdit() {
    if (!homework) return;
    setTitle(homework.title);
    setDescription(homework.description ?? '');
    setDueDate(homework.dueDate.slice(0, 10));
    setEditing(true);
  }

  async function saveEdit() {
    if (!homework) return;
    const updated = await homeworkActions.editHomework(homework.id, {
      title: title.trim(),
      description: description.trim() || null,
      dueDate,
    });
    if (updated) {
      setEditing(false);
      submissionsHook.handleRefresh();
    }
  }

  async function pickAndUploadAttachment() {
    if (!homework) return;
    const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    await homeworkActions.uploadAttachment(homework.id, { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? null });
    submissionsHook.handleRefresh();
  }

  function scoreDraftFor(submissionId: string, defaults: { score: number | null; maxScore: number | null; teacherRemark: string | null }) {
    return (
      scoreDrafts[submissionId] ?? {
        score: defaults.score !== null ? String(defaults.score) : '',
        maxScore: defaults.maxScore !== null ? String(defaults.maxScore) : '',
        teacherRemark: defaults.teacherRemark ?? '',
      }
    );
  }

  function updateDraft(submissionId: string, patch: Partial<{ score: string; maxScore: string; teacherRemark: string }>) {
    setScoreDrafts((prev) => ({ ...prev, [submissionId]: { ...scoreDraftFor(submissionId, { score: null, maxScore: null, teacherRemark: null }), ...prev[submissionId], ...patch } }));
  }

  async function saveOneScore(submissionId: string) {
    const draft = scoreDrafts[submissionId];
    if (!draft) return;
    const score = draft.score.trim() ? Number(draft.score) : null;
    const maxScore = draft.maxScore.trim() ? Number(draft.maxScore) : null;
    await submissionsHook.scoreSubmission(submissionId, {
      status: 'REVIEWED',
      score,
      maxScore,
      teacherRemark: draft.teacherRemark.trim() || null,
    });
  }

  async function markRemainingNotSubmitted() {
    if (unsubmittedStudentIds.length === 0) return;
    await submissionsHook.saveBatchScores(unsubmittedStudentIds.map((studentId) => ({ studentId, status: 'NOT_SUBMITTED' })));
  }

  return (
    <ScrollView
      style={styles.teacherScreen}
      refreshControl={<RefreshControl refreshing={submissionsHook.refreshing} onRefresh={submissionsHook.handleRefresh} />}
    >
      {!hasFeature('HOMEWORK') ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>Homework is not enabled for your school.</Text>
        </View>
      ) : !homework ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={tc.primary} />
        </View>
      ) : (
        <>
          {submissionsHook.error ? <Text style={styles.errorBanner}>{submissionsHook.error}</Text> : null}

          <View style={styles.teacherCard}>
            {editing ? (
              <>
                <Text style={styles.teacherInputLabel}>Title</Text>
                <TextInput style={styles.teacherInput} value={title} onChangeText={setTitle} placeholderTextColor={tc.onSurfaceVariant} />
                <Text style={styles.teacherInputLabel}>Due Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.teacherInput} value={dueDate} onChangeText={setDueDate} placeholderTextColor={tc.onSurfaceVariant} />
                <Text style={styles.teacherInputLabel}>Description</Text>
                <TextInput style={styles.teacherInput} value={description} onChangeText={setDescription} placeholderTextColor={tc.onSurfaceVariant} />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <Pressable style={[styles.teacherPrimaryButton, { backgroundColor: tc.primary, flex: 1 }]} onPress={saveEdit} disabled={homeworkActions.editing}>
                    {homeworkActions.editing ? <ActivityIndicator color="#fff" /> : <Text style={styles.teacherPrimaryButtonText}>Save</Text>}
                  </Pressable>
                  <Pressable style={[styles.teacherPrimaryButton, { backgroundColor: tc.surfaceContainerHigh, flex: 1 }]} onPress={() => setEditing(false)}>
                    <Text style={[styles.teacherPrimaryButtonText, { color: tc.onSurface }]}>Cancel</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.teacherCardHeaderRow}>
                  <Text style={styles.teacherSectionTitle}>{homework.title}</Text>
                  <Text style={[styles.teacherPill, styles.teacherPillMuted]}>{formatStatus(homework.status)}</Text>
                </View>
                <Text style={styles.teacherListRowSubtext}>
                  {homework.subject} · {homework.section.class.name}-{homework.section.name} · Due {formatDateTime(homework.deadlineAt)}
                </Text>
                {homework.description ? <Text style={styles.teacherMeta}>{homework.description}</Text> : null}
                {canEdit ? (
                  <Pressable style={[styles.smallButton, { marginTop: 8, backgroundColor: tc.secondary }]} onPress={startEdit}>
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>

          <View style={styles.teacherCard}>
            <Text style={styles.teacherSectionTitle}>Attachment</Text>
            {homework.attachmentUrl ? (
              <Text style={styles.teacherMeta}>Reference material attached.</Text>
            ) : (
              <Text style={styles.teacherEmptyText}>No attachment yet.</Text>
            )}
            {canEdit ? (
              <Pressable style={[styles.smallButton, { marginTop: 8, backgroundColor: tc.secondary }]} onPress={pickAndUploadAttachment} disabled={homeworkActions.uploading}>
                {homeworkActions.uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.smallButtonText}>{homework.attachmentUrl ? 'Replace' : 'Upload'} Attachment</Text>
                )}
              </Pressable>
            ) : null}
          </View>

          {dashboard.data ? (
            <View style={styles.teacherCard}>
              <Text style={styles.teacherSectionTitle}>Class Progress</Text>
              <Text style={styles.teacherListRowSubtext}>
                {dashboard.data.summary.averagePercentage !== null ? `${dashboard.data.summary.averagePercentage}% average completion` : 'No data yet'}
              </Text>
              <View style={styles.summaryRow}>
                <Text style={styles.teacherMeta}>Above 90%: {dashboard.data.summary.above90Count}</Text>
                <Text style={styles.teacherMeta}>Below 70%: {dashboard.data.summary.below70Count}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.teacherCard}>
            <View style={styles.teacherCardHeaderRow}>
              <Text style={styles.teacherSectionTitle}>Submissions</Text>
              {submissionsHook.loading ? <ActivityIndicator color={tc.primary} /> : null}
            </View>
            {canReview && pastDeadline && unsubmittedStudentIds.length > 0 ? (
              <Pressable style={[styles.smallButton, { marginTop: 8, backgroundColor: tc.secondary }]} onPress={markRemainingNotSubmitted} disabled={submissionsHook.saving}>
                <Text style={styles.smallButtonText}>Mark {unsubmittedStudentIds.length} Remaining as Not Submitted</Text>
              </Pressable>
            ) : null}
          </View>

          {submissionsHook.submissions.map((submission) => {
            const draft = scoreDraftFor(submission.id, submission);
            const isChecked = submission.submissionStatus === 'CHECKED';
            return (
              <View key={submission.id} style={styles.teacherCard}>
                <View style={styles.teacherCardHeaderRow}>
                  <Text style={styles.teacherListRowTitle}>{submission.student.name}</Text>
                  <Text style={[styles.teacherPill, styles.teacherPillMuted]}>{formatStatus(submission.submissionStatus)}</Text>
                </View>
                <Text style={styles.teacherListRowSubtext}>Roll {submission.student.rollNo} · Submitted {formatDateTime(submission.submittedAt)}</Text>
                {submission.attachmentUrl ? (
                  <Text style={styles.teacherMeta}>Attachment available.</Text>
                ) : (
                  <Text style={styles.teacherMeta}>No attachment on file.</Text>
                )}

                {canReview ? (
                  <>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TextInput
                        style={[styles.teacherInput, { flex: 1 }]}
                        placeholder="Score"
                        placeholderTextColor={tc.onSurfaceVariant}
                        keyboardType="numeric"
                        value={draft.score}
                        onChangeText={(v) => updateDraft(submission.id, { score: v })}
                      />
                      <TextInput
                        style={[styles.teacherInput, { flex: 1 }]}
                        placeholder="Max"
                        placeholderTextColor={tc.onSurfaceVariant}
                        keyboardType="numeric"
                        value={draft.maxScore}
                        onChangeText={(v) => updateDraft(submission.id, { maxScore: v })}
                      />
                    </View>
                    <TextInput
                      style={[styles.teacherInput, { marginTop: 8 }]}
                      placeholder="Remark"
                      placeholderTextColor={tc.onSurfaceVariant}
                      value={draft.teacherRemark}
                      onChangeText={(v) => updateDraft(submission.id, { teacherRemark: v })}
                    />
                    <Pressable style={[styles.smallButton, { marginTop: 8, backgroundColor: tc.secondary }]} onPress={() => saveOneScore(submission.id)} disabled={submissionsHook.saving}>
                      <Text style={styles.smallButtonText}>Save Score</Text>
                    </Pressable>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <Text style={styles.teacherListRowSubtext}>Marked Complete</Text>
                      <Switch
                        value={isChecked}
                        onValueChange={(value) => {
                          void submissionsHook.setCompletion([{ studentId: submission.studentId, completed: value }]);
                        }}
                        disabled={submissionsHook.saving}
                      />
                    </View>
                  </>
                ) : null}
              </View>
            );
          })}

          {submissionsHook.submissions.length === 0 && !submissionsHook.loading ? (
            <View style={[styles.teacherCard, styles.teacherLastCard]}>
              <Text style={styles.teacherEmptyText}>No submissions yet.</Text>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
