import React, { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTeacherHomework } from '@/hooks/useTeacherHomework';
import { useTeacherPermissions } from '@/hooks/useTeacherPermissions';
import { can } from '@/lib/teacher-permissions';
import { formatDate, formatStatus } from '@/lib/format';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';
import type { TeacherAssignment } from '@/lib/types';

const tc = TeacherTheme.colors;

// New homework uses the managed attachment upload flow exclusively — there
// is no legacy attachmentUrl text field here (the backend's legacy column
// is still readable/displayed for historical records in the detail screen,
// just never written to from this create form).
export default function TeacherHomeworkListScreen() {
  const { role } = useAuth();
  const router = useRouter();
  const homework = useTeacherHomework();
  const permissions = useTeacherPermissions();

  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; mimeType: string | null } | null>(null);
  const [partialSuccessMessage, setPartialSuccessMessage] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const canCreate = selectedAssignment ? can(permissions.data, 'HOMEWORK', 'CREATE', { sectionId: selectedAssignment.sectionId }) : true;

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPickedFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? null });
  }

  async function handleCreate() {
    if (!selectedAssignment) return;
    setPartialSuccessMessage(null);
    setAttachError(null);

    const created = await homework.createHomework({
      title: title.trim(),
      subject: selectedAssignment.subject,
      sectionId: selectedAssignment.sectionId,
      dueDate,
      description: description.trim() || undefined,
    });
    if (!created) return; // homework.error already set by the hook

    if (pickedFile) {
      const uploaded = await homework.uploadAttachment(created.id, pickedFile);
      if (!uploaded) {
        // The homework itself was created successfully — never imply it failed.
        setPartialSuccessMessage('Homework created, but the attachment could not be uploaded.');
        setAttachError(homework.error);
        router.push(`/teacher/work/homework/${created.id}`);
        return;
      }
    }

    setShowForm(false);
    setSelectedAssignment(null);
    setTitle('');
    setDueDate('');
    setDescription('');
    setPickedFile(null);
  }

  return (
    <ScrollView
      style={styles.teacherScreen}
      refreshControl={<RefreshControl refreshing={homework.refreshing} onRefresh={homework.handleRefresh} />}
    >
      <View style={styles.teacherCard}>
        <View style={styles.teacherCardHeaderRow}>
          <Text style={styles.teacherSectionTitle}>Assigned Homework</Text>
          {homework.loading ? <ActivityIndicator color={tc.primary} /> : null}
        </View>
        <Pressable style={[styles.teacherPrimaryButton, { backgroundColor: tc.primary, marginTop: 12 }]} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.teacherPrimaryButtonText}>{showForm ? 'Cancel' : 'New Homework'}</Text>
        </Pressable>
      </View>

      {homework.error && !partialSuccessMessage ? <Text style={styles.errorBanner}>{homework.error}</Text> : null}
      {partialSuccessMessage ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorTitle}>{partialSuccessMessage}</Text>
          {attachError ? <Text style={styles.inlineErrorText}>{attachError}</Text> : null}
        </View>
      ) : null}

      {showForm ? (
        <View style={styles.teacherCard}>
          <Text style={styles.teacherInputLabel}>Class / Section / Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {homework.assignments.map((assignment) => {
              const isSelected = selectedAssignment?.sectionId === assignment.sectionId && selectedAssignment?.subject === assignment.subject;
              return (
                <Pressable
                  key={`${assignment.sectionId}-${assignment.subject}`}
                  style={[styles.childChip, isSelected && { borderColor: tc.secondary, backgroundColor: tc.secondaryContainer + '1a' }]}
                  onPress={() => setSelectedAssignment(assignment)}
                >
                  <Text style={[styles.childChipText, isSelected && { color: tc.secondary }]}>{assignment.subject}</Text>
                  <Text style={styles.childChipSubtext}>
                    {assignment.className}-{assignment.sectionName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {homework.assignments.length === 0 ? (
            <Text style={styles.teacherEmptyText}>You have no assigned class/section to create homework for.</Text>
          ) : null}

          <Text style={styles.teacherInputLabel}>Title</Text>
          <TextInput style={styles.teacherInput} placeholder="Homework title" placeholderTextColor={tc.onSurfaceVariant} value={title} onChangeText={setTitle} />

          <Text style={styles.teacherInputLabel}>Due Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.teacherInput} placeholder="2026-07-15" placeholderTextColor={tc.onSurfaceVariant} value={dueDate} onChangeText={setDueDate} />

          <Text style={styles.teacherInputLabel}>Description (optional)</Text>
          <TextInput
            style={styles.teacherInput}
            placeholder="Details for students"
            placeholderTextColor={tc.onSurfaceVariant}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.teacherInputLabel}>Attachment (optional)</Text>
          <Pressable style={styles.smallButton} onPress={pickFile}>
            <Text style={styles.smallButtonText}>{pickedFile ? 'Change File' : 'Choose File'}</Text>
          </Pressable>
          {pickedFile ? <Text style={styles.teacherMeta}>{pickedFile.name}</Text> : null}

          {!canCreate ? <Text style={styles.errorText}>You do not have permission to create homework for this section.</Text> : null}

          <Pressable
            style={[
              styles.teacherPrimaryButton,
              { backgroundColor: tc.primary, marginTop: 12 },
              (!selectedAssignment || !title.trim() || !dueDate.trim() || !canCreate || homework.creating || homework.uploading) &&
                styles.teacherPrimaryButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!selectedAssignment || !title.trim() || !dueDate.trim() || !canCreate || homework.creating || homework.uploading}
          >
            {homework.creating || homework.uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.teacherPrimaryButtonText}>Create</Text>}
          </Pressable>
        </View>
      ) : null}

      {homework.homework.map((item) => {
        const submittedCount = item.studentStatuses.filter((s) => s.submissionStatus !== 'PENDING' && s.submissionStatus !== 'NOT_SUBMITTED').length;
        return (
          <Pressable key={item.id} style={styles.teacherCard} onPress={() => router.push(`/teacher/work/homework/${item.id}`)}>
            <View style={styles.teacherCardHeaderRow}>
              <Text style={styles.teacherListRowTitle}>{item.title}</Text>
              <Text style={[styles.teacherPill, styles.teacherPillMuted]}>{formatStatus(item.status)}</Text>
            </View>
            <Text style={styles.teacherListRowSubtext}>
              {item.subject} · {item.section.class.name}-{item.section.name} · Due {formatDate(item.dueDate)}
            </Text>
            <Text style={styles.teacherMeta}>
              {submittedCount} of {item.studentStatuses.length} students submitted
            </Text>
          </Pressable>
        );
      })}

      {homework.homework.length === 0 && !homework.loading ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>No homework assigned yet.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
