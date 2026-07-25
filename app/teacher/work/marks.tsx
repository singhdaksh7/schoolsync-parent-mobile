import React, { useMemo, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useTeacherHomework } from '@/hooks/useTeacherHomework';
import { useTeacherMarks } from '@/hooks/useTeacherMarks';
import { useTeacherPermissions } from '@/hooks/useTeacherPermissions';
import { findInvalidMarkStudentIds } from '@/lib/marks-validation';
import { can } from '@/lib/teacher-permissions';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';
import type { TeacherAssignment, TeacherExamItem } from '@/lib/types';

const tc = TeacherTheme.colors;

// The exam is picked from GET /api/teacher/exams (useTeacherMarks.exams) —
// never manually typed. Section comes from the teacher's real assignments
// (useTeacherHomework), never invented.
export default function TeacherMarksScreen() {
  const { role } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const permissions = useTeacherPermissions();
  const homework = useTeacherHomework();
  const marks = useTeacherMarks();

  const [selectedExam, setSelectedExam] = useState<TeacherExamItem | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const examId = selectedExam?.id ?? '';
  const maxMarksNumber = selectedExam?.maxMarks ?? null;

  const existingByStudentId = useMemo(() => new Map(marks.results.map((r) => [r.studentId, r.marks])), [marks.results]);

  function draftFor(studentId: string) {
    if (drafts[studentId] !== undefined) return drafts[studentId];
    const existing = existingByStudentId.get(studentId);
    return existing !== undefined ? String(existing) : '';
  }

  const invalidRows = useMemo(() => {
    if (!selectedAssignment) return new Set<string>();
    return findInvalidMarkStudentIds(
      selectedAssignment.students.map((s) => s.id),
      draftFor,
      maxMarksNumber
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssignment, drafts, maxMarksNumber, marks.results]);

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const canView = selectedAssignment ? can(permissions.data, 'MARKS', 'VIEW', { sectionId: selectedAssignment.sectionId }) : true;
  const canEnter = selectedAssignment ? can(permissions.data, 'MARKS', 'ENTER', { sectionId: selectedAssignment.sectionId }) : true;

  async function handleLoad() {
    if (!selectedAssignment || !examId) return;
    await marks.load(examId, selectedAssignment.sectionId);
  }

  function updateDraft(studentId: string, value: string) {
    setDrafts((prev) => ({ ...prev, [studentId]: value }));
  }

  async function handleSave() {
    if (!selectedAssignment || !examId || invalidRows.size > 0) return;
    const entries = selectedAssignment.students
      .map((student) => {
        const raw = draftFor(student.id);
        if (!raw.trim()) return null;
        return { studentId: student.id, marks: Number(raw) };
      })
      .filter((entry): entry is { studentId: string; marks: number } => entry !== null);
    if (entries.length === 0) return;
    await marks.save(examId, selectedAssignment.sectionId, entries);
  }

  return (
    <ScrollView style={styles.teacherScreen}>
      <View style={styles.teacherHeader}>
        <Text style={styles.teacherHeaderTitle}>Marks</Text>
      </View>

      {!hasFeature('MOBILE_APP') ? null : (
        <View style={styles.teacherCard}>
          <Text style={styles.teacherInputLabel}>Class / Section</Text>
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

          <Text style={styles.teacherInputLabel}>Exam</Text>
          {marks.examsLoading ? (
            <ActivityIndicator color={tc.primary} />
          ) : marks.exams.length === 0 ? (
            <Text style={styles.teacherEmptyText}>No exams available.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {marks.exams.map((exam) => {
                const isSelected = selectedExam?.id === exam.id;
                return (
                  <Pressable
                    key={exam.id}
                    style={[styles.childChip, isSelected && { borderColor: tc.secondary, backgroundColor: tc.secondaryContainer + '1a' }]}
                    onPress={() => setSelectedExam(exam)}
                  >
                    <Text style={[styles.childChipText, isSelected && { color: tc.secondary }]}>{exam.name}</Text>
                    <Text style={styles.childChipSubtext}>
                      {exam.examSchemeName} · max {exam.maxMarks}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
          {marks.examsError ? <Text style={styles.errorBanner}>{marks.examsError}</Text> : null}

          <Pressable
            style={[styles.teacherPrimaryButton, { backgroundColor: tc.primary, marginTop: 12 }, (!selectedAssignment || !examId) && styles.teacherPrimaryButtonDisabled]}
            onPress={handleLoad}
            disabled={!selectedAssignment || !examId || marks.loading}
          >
            {marks.loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.teacherPrimaryButtonText}>Load Students</Text>}
          </Pressable>
        </View>
      )}

      {marks.error ? <Text style={styles.errorBanner}>{marks.error}</Text> : null}

      {marks.context && selectedAssignment && !canView ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>You do not have permission to view marks for this section.</Text>
        </View>
      ) : null}

      {marks.context && selectedAssignment && canView ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherSectionTitle}>Students</Text>
          {selectedAssignment.students.map((student) => {
            const isInvalid = invalidRows.has(student.id);
            return (
              <View key={student.id} style={styles.teacherListRow}>
                <View style={styles.teacherListRowLeft}>
                  <View style={styles.teacherRollBadge}>
                    <Text style={styles.teacherRollBadgeText}>{student.rollNo}</Text>
                  </View>
                  <View>
                    <Text style={styles.teacherListRowTitle}>{student.name}</Text>
                    <Text style={styles.teacherListRowSubtext}>Roll {student.rollNo}</Text>
                  </View>
                </View>
                <TextInput
                  style={[styles.teacherInput, { width: 80 }, isInvalid && { borderColor: tc.error }]}
                  keyboardType="numeric"
                  placeholder="Marks"
                  placeholderTextColor={tc.onSurfaceVariant}
                  value={draftFor(student.id)}
                  onChangeText={(v) => updateDraft(student.id, v)}
                  editable={canEnter}
                />
              </View>
            );
          })}
          {invalidRows.size > 0 ? <Text style={styles.errorText}>{invalidRows.size} row(s) exceed the maximum marks or are invalid.</Text> : null}
          {canEnter ? (
            <Pressable
              style={[styles.teacherPrimaryButton, { backgroundColor: tc.primary, marginTop: 12 }, (invalidRows.size > 0 || marks.saving) && styles.teacherPrimaryButtonDisabled]}
              onPress={handleSave}
              disabled={invalidRows.size > 0 || marks.saving}
            >
              {marks.saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.teacherPrimaryButtonText}>Save Marks</Text>}
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
