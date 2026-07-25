import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useExamMilestones } from '@/hooks/useExamMilestones';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useNotebook } from '@/hooks/useNotebook';
import { useTeacherHomework } from '@/hooks/useTeacherHomework';
import { useTeacherPermissions } from '@/hooks/useTeacherPermissions';
import { can } from '@/lib/teacher-permissions';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';
import type { TeacherAssignment } from '@/lib/types';

const tc = TeacherTheme.colors;

// No OCR, no AI, no photo analysis — a plain checked/unchecked + remarks
// roster, exactly matching the actual backend contract.
export default function TeacherNotebookScreen() {
  const { role } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const permissions = useTeacherPermissions();
  const homework = useTeacherHomework();
  const milestones = useExamMilestones();
  const notebook = useNotebook();

  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [remarkDrafts, setRemarkDrafts] = useState<Record<string, string>>({});

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const notebookEnabled = hasFeature('NOTEBOOK_CHECKING');
  const canView = selectedAssignment ? can(permissions.data, 'NOTEBOOK', 'VIEW', { sectionId: selectedAssignment.sectionId }) : true;
  const canMark = selectedAssignment ? can(permissions.data, 'NOTEBOOK', 'MARK', { sectionId: selectedAssignment.sectionId }) : true;

  async function handleLoad() {
    if (!selectedAssignment || !selectedMilestoneId) return;
    await notebook.load(selectedAssignment.sectionId, selectedAssignment.subject, selectedMilestoneId);
  }

  async function toggleChecked(studentId: string, checked: boolean) {
    if (!selectedAssignment || !selectedMilestoneId) return;
    await notebook.save(selectedAssignment.sectionId, selectedAssignment.subject, selectedMilestoneId, [
      { studentId, checked, remarks: remarkDrafts[studentId] ?? null },
    ]);
  }

  if (!notebookEnabled) {
    return (
      <View style={styles.teacherScreen}>
        <View style={styles.teacherHeader}>
          <Text style={styles.teacherHeaderTitle}>Notebook Checking</Text>
        </View>
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>Notebook Checking is not enabled for your school.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.teacherScreen}>
      <View style={styles.teacherHeader}>
        <Text style={styles.teacherHeaderTitle}>Notebook Checking</Text>
      </View>

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

        <Text style={styles.teacherInputLabel}>Exam Milestone</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {milestones.milestones.map((milestone) => {
            const isSelected = selectedMilestoneId === milestone.id;
            return (
              <Pressable
                key={milestone.id}
                style={[styles.childChip, isSelected && { borderColor: tc.secondary, backgroundColor: tc.secondaryContainer + '1a' }]}
                onPress={() => setSelectedMilestoneId(milestone.id)}
              >
                <Text style={[styles.childChipText, isSelected && { color: tc.secondary }]}>{milestone.name}</Text>
              </Pressable>
            );
          })}
          {milestones.milestones.length === 0 && !milestones.loading ? <Text style={styles.teacherEmptyText}>No active exam milestones.</Text> : null}
        </ScrollView>

        <Pressable
          style={[
            styles.teacherPrimaryButton,
            { backgroundColor: tc.primary, marginTop: 12 },
            (!selectedAssignment || !selectedMilestoneId) && styles.teacherPrimaryButtonDisabled,
          ]}
          onPress={handleLoad}
          disabled={!selectedAssignment || !selectedMilestoneId || notebook.loading}
        >
          {notebook.loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.teacherPrimaryButtonText}>Load Roster</Text>}
        </Pressable>
      </View>

      {notebook.error ? <Text style={styles.errorBanner}>{notebook.error}</Text> : null}

      {notebook.context && !canView ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>You do not have permission to view notebook checks for this section.</Text>
        </View>
      ) : null}

      {notebook.context && canView ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherSectionTitle}>Roster</Text>
          {notebook.roster.map((entry) => (
            <View key={entry.studentId} style={styles.teacherListRow}>
              <View style={styles.teacherListRowLeft}>
                <View style={styles.teacherRollBadge}>
                  <Text style={styles.teacherRollBadgeText}>{entry.rollNo}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teacherListRowTitle}>{entry.name}</Text>
                  <Text style={styles.teacherListRowSubtext}>Roll {entry.rollNo}</Text>
                  {canMark ? (
                    <TextInput
                      style={styles.teacherInput}
                      placeholder="Remarks (optional)"
                      placeholderTextColor={tc.onSurfaceVariant}
                      value={remarkDrafts[entry.studentId] ?? entry.remarks ?? ''}
                      onChangeText={(v) => setRemarkDrafts((prev) => ({ ...prev, [entry.studentId]: v }))}
                    />
                  ) : entry.remarks ? (
                    <Text style={styles.teacherMeta}>{entry.remarks}</Text>
                  ) : null}
                </View>
              </View>
              <Switch value={entry.checked} onValueChange={(v) => void toggleChecked(entry.studentId, v)} disabled={!canMark || notebook.saving} />
            </View>
          ))}
          {notebook.roster.length === 0 ? <Text style={styles.teacherEmptyText}>No students in this section.</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
