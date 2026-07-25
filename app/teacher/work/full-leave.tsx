import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTeacherFullLeave } from '@/hooks/useTeacherFullLeave';
import { formatDate, formatStatus } from '@/lib/format';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

// Full multi-day leave — distinct from Early Leave (single-day, after a
// specific period). Teacher can view/create their own requests only; no
// approval/reject control exists here — that belongs to Operations leave
// management, a separate surface this screen never touches.
export default function TeacherFullLeaveScreen() {
  const { role } = useAuth();
  const fullLeave = useTeacherFullLeave();

  const [showForm, setShowForm] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  if (role !== 'TEACHER') return <Redirect href="/" />;

  async function handleCreate() {
    if (!fromDate.trim() || !toDate.trim() || !reason.trim()) return;
    const ok = await fullLeave.createLeave({ fromDate: fromDate.trim(), toDate: toDate.trim(), reason: reason.trim() });
    if (ok) {
      setShowForm(false);
      setFromDate('');
      setToDate('');
      setReason('');
    }
  }

  return (
    <ScrollView style={styles.teacherScreen} refreshControl={<RefreshControl refreshing={fullLeave.refreshing} onRefresh={fullLeave.handleRefresh} />}>
      <View style={styles.teacherHeader}>
        <Text style={styles.teacherHeaderTitle}>Full Leave</Text>
      </View>

      <View style={styles.teacherCard}>
        <View style={styles.teacherCardHeaderRow}>
          <Text style={styles.teacherSectionTitle}>Your Leave Requests</Text>
          {fullLeave.loading ? <ActivityIndicator color={tc.primary} /> : null}
        </View>
        <Pressable style={[styles.teacherPrimaryButton, { backgroundColor: tc.primary, marginTop: 12 }]} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.teacherPrimaryButtonText}>{showForm ? 'Cancel' : 'New Request'}</Text>
        </Pressable>
      </View>

      {fullLeave.error ? <Text style={styles.errorBanner}>{fullLeave.error}</Text> : null}

      {showForm ? (
        <View style={styles.teacherCard}>
          <Text style={styles.teacherInputLabel}>From Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.teacherInput} placeholder="2026-07-15" placeholderTextColor={tc.onSurfaceVariant} value={fromDate} onChangeText={setFromDate} />

          <Text style={styles.teacherInputLabel}>To Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.teacherInput} placeholder="2026-07-18" placeholderTextColor={tc.onSurfaceVariant} value={toDate} onChangeText={setToDate} />

          <Text style={styles.teacherInputLabel}>Reason</Text>
          <TextInput style={styles.teacherInput} placeholder="Reason for leave" placeholderTextColor={tc.onSurfaceVariant} value={reason} onChangeText={setReason} />

          <Pressable
            style={[styles.teacherPrimaryButton, { backgroundColor: tc.primary, marginTop: 12 }, fullLeave.creating && styles.teacherPrimaryButtonDisabled]}
            onPress={handleCreate}
            disabled={fullLeave.creating}
          >
            {fullLeave.creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.teacherPrimaryButtonText}>Submit</Text>}
          </Pressable>
        </View>
      ) : null}

      {fullLeave.leaves.map((leave) => (
        <View key={leave.id} style={styles.teacherCard}>
          <View style={styles.teacherCardHeaderRow}>
            <Text style={styles.teacherListRowTitle}>
              {formatDate(leave.fromDate)} – {formatDate(leave.toDate)}
            </Text>
            <Text style={[styles.teacherPill, styles.teacherPillMuted]}>{formatStatus(leave.status)}</Text>
          </View>
          <Text style={styles.teacherMeta}>{leave.reason}</Text>
          {leave.reviewedBy ? <Text style={styles.teacherListRowSubtext}>Reviewed by {leave.reviewedBy.name}</Text> : null}
        </View>
      ))}

      {fullLeave.leaves.length === 0 && !fullLeave.loading ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>No leave requests yet.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
