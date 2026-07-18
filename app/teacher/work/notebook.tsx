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
import type { TeacherAssignment } from '@/lib/types';

// No OCR, no AI, no photo analysis — a plain checked/unchecked + remarks
// roster, exactly matching the actual backend contract.
export default function TeacherNotebookScreen() {
  const { role, branding } = useAuth();
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
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: branding.primaryColor }]}>
          <Text style={styles.title}>Notebook Checking</Text>
        </View>
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>Notebook Checking is not enabled for your school.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: branding.primaryColor }]}>
        <Text style={styles.title}>Notebook Checking</Text>
      </View>

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

        <Text style={styles.label}>Exam Milestone</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {milestones.milestones.map((milestone) => {
            const isSelected = selectedMilestoneId === milestone.id;
            return (
              <Pressable
                key={milestone.id}
                style={[styles.childChip, isSelected && { borderColor: branding.primaryColor, backgroundColor: '#eef6ff' }]}
                onPress={() => setSelectedMilestoneId(milestone.id)}
              >
                <Text style={[styles.childChipText, isSelected && { color: branding.primaryColor }]}>{milestone.name}</Text>
              </Pressable>
            );
          })}
          {milestones.milestones.length === 0 && !milestones.loading ? <Text style={styles.emptyText}>No active exam milestones.</Text> : null}
        </ScrollView>

        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: branding.primaryColor },
            (!selectedAssignment || !selectedMilestoneId) && styles.primaryButtonDisabled,
          ]}
          onPress={handleLoad}
          disabled={!selectedAssignment || !selectedMilestoneId || notebook.loading}
        >
          {notebook.loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Load Roster</Text>}
        </Pressable>
      </View>

      {notebook.error ? <Text style={styles.errorBanner}>{notebook.error}</Text> : null}

      {notebook.context && !canView ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>You do not have permission to view notebook checks for this section.</Text>
        </View>
      ) : null}

      {notebook.context && canView ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.sectionTitle}>Roster</Text>
          {notebook.roster.map((entry) => (
            <View key={entry.studentId} style={styles.teacherListItem}>
              <View style={styles.teacherListBody}>
                <Text style={styles.listRowTitle}>{entry.name}</Text>
                <Text style={styles.listRowSubtext}>Roll {entry.rollNo}</Text>
                {canMark ? (
                  <TextInput
                    style={styles.submitInput}
                    placeholder="Remarks (optional)"
                    placeholderTextColor="#8a8a8a"
                    value={remarkDrafts[entry.studentId] ?? entry.remarks ?? ''}
                    onChangeText={(v) => setRemarkDrafts((prev) => ({ ...prev, [entry.studentId]: v }))}
                  />
                ) : entry.remarks ? (
                  <Text style={styles.remarkText}>{entry.remarks}</Text>
                ) : null}
              </View>
              <Switch value={entry.checked} onValueChange={(v) => void toggleChecked(entry.studentId, v)} disabled={!canMark || notebook.saving} />
            </View>
          ))}
          {notebook.roster.length === 0 ? <Text style={styles.emptyText}>No students in this section.</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
