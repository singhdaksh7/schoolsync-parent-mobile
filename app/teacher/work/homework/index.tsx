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
import type { TeacherAssignment } from '@/lib/types';

// New homework uses the managed attachment upload flow exclusively — there
// is no legacy attachmentUrl text field here (the backend's legacy column
// is still readable/displayed for historical records in the detail screen,
// just never written to from this create form).
export default function TeacherHomeworkListScreen() {
  const { role, branding } = useAuth();
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
      style={styles.container}
      refreshControl={<RefreshControl refreshing={homework.refreshing} onRefresh={homework.handleRefresh} />}
    >
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Assigned Homework</Text>
          {homework.loading ? <ActivityIndicator color={branding.primaryColor} /> : null}
        </View>
        <Pressable style={[styles.primaryButton, { backgroundColor: branding.primaryColor }]} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.primaryButtonText}>{showForm ? 'Cancel' : 'New Homework'}</Text>
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
        <View style={styles.card}>
          <Text style={styles.label}>Class / Section / Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {homework.assignments.map((assignment) => {
              const isSelected = selectedAssignment?.sectionId === assignment.sectionId && selectedAssignment?.subject === assignment.subject;
              return (
                <Pressable
                  key={`${assignment.sectionId}-${assignment.subject}`}
                  style={[styles.childChip, isSelected && { borderColor: branding.primaryColor, backgroundColor: '#eef6ff' }]}
                  onPress={() => setSelectedAssignment(assignment)}
                >
                  <Text style={[styles.childChipText, isSelected && { color: branding.primaryColor }]}>{assignment.subject}</Text>
                  <Text style={styles.childChipSubtext}>
                    {assignment.className}-{assignment.sectionName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {homework.assignments.length === 0 ? (
            <Text style={styles.emptyText}>You have no assigned class/section to create homework for.</Text>
          ) : null}

          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} placeholder="Homework title" placeholderTextColor="#8a8a8a" value={title} onChangeText={setTitle} />

          <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="2026-07-15" placeholderTextColor="#8a8a8a" value={dueDate} onChangeText={setDueDate} />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Details for students"
            placeholderTextColor="#8a8a8a"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Attachment (optional)</Text>
          <Pressable style={styles.smallButton} onPress={pickFile}>
            <Text style={styles.smallButtonText}>{pickedFile ? 'Change File' : 'Choose File'}</Text>
          </Pressable>
          {pickedFile ? <Text style={styles.remarkText}>{pickedFile.name}</Text> : null}

          {!canCreate ? <Text style={styles.errorText}>You do not have permission to create homework for this section.</Text> : null}

          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: branding.primaryColor },
              (!selectedAssignment || !title.trim() || !dueDate.trim() || !canCreate || homework.creating || homework.uploading) &&
                styles.primaryButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!selectedAssignment || !title.trim() || !dueDate.trim() || !canCreate || homework.creating || homework.uploading}
          >
            {homework.creating || homework.uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Create</Text>}
          </Pressable>
        </View>
      ) : null}

      {homework.homework.map((item) => {
        const submittedCount = item.studentStatuses.filter((s) => s.submissionStatus !== 'PENDING' && s.submissionStatus !== 'NOT_SUBMITTED').length;
        return (
          <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/teacher/work/homework/${item.id}`)}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.listRowTitle}>{item.title}</Text>
              <Text style={styles.statusPill}>{formatStatus(item.status)}</Text>
            </View>
            <Text style={styles.listRowSubtext}>
              {item.subject} · {item.section.class.name}-{item.section.name} · Due {formatDate(item.dueDate)}
            </Text>
            <Text style={styles.remarkText}>
              {submittedCount} of {item.studentStatuses.length} students submitted
            </Text>
          </Pressable>
        );
      })}

      {homework.homework.length === 0 && !homework.loading ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>No homework assigned yet.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
