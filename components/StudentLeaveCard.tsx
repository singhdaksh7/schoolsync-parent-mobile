import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { styles } from '@/lib/styles';
import { Theme } from '@/constants/theme';
import { formatDate, formatStatus } from '@/lib/format';
import type { StudentLeave } from '@/hooks/useStudentLeave';
import { EmptyState } from './EmptyState';

export function StudentLeaveCard({
  leaves,
  loading,
  creating,
  error,
  color,
  onCreate,
}: {
  leaves: StudentLeave[];
  loading: boolean;
  creating: boolean;
  error: string | null;
  color: string;
  onCreate: (input: { leaveType: string; reason: string; fromDate: string; toDate: string }) => Promise<boolean>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  async function handleCreate() {
    if (!leaveType.trim() || !reason.trim() || !fromDate.trim() || !toDate.trim()) return;
    const ok = await onCreate({ leaveType: leaveType.trim(), reason: reason.trim(), fromDate: fromDate.trim(), toDate: toDate.trim() });
    if (ok) {
      setShowForm(false);
      setLeaveType('');
      setFromDate('');
      setToDate('');
      setReason('');
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.sectionTitle}>Leave Requests</Text>
        {loading ? <ActivityIndicator color={color} /> : null}
      </View>
      <Pressable style={[styles.primaryButton, { backgroundColor: color }]} onPress={() => setShowForm((v) => !v)}>
        <Text style={styles.primaryButtonText}>{showForm ? 'Cancel' : 'New Request'}</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {showForm ? (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.label}>Leave Type</Text>
          <TextInput style={styles.input} placeholder="e.g. Sick, Family" placeholderTextColor={Theme.colors.onSurfaceVariant} value={leaveType} onChangeText={setLeaveType} />

          <Text style={styles.label}>From Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="2026-07-15" placeholderTextColor={Theme.colors.onSurfaceVariant} value={fromDate} onChangeText={setFromDate} />

          <Text style={styles.label}>To Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="2026-07-18" placeholderTextColor={Theme.colors.onSurfaceVariant} value={toDate} onChangeText={setToDate} />

          <Text style={styles.label}>Reason</Text>
          <TextInput style={styles.input} placeholder="Reason for leave" placeholderTextColor={Theme.colors.onSurfaceVariant} value={reason} onChangeText={setReason} />

          <Pressable style={[styles.primaryButton, { backgroundColor: color }, creating && styles.primaryButtonDisabled]} onPress={handleCreate} disabled={creating}>
            {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Submit</Text>}
          </Pressable>
        </View>
      ) : null}

      {leaves.slice(0, 5).map((leave) => (
        <View key={leave.id} style={styles.listRow}>
          <View style={styles.listRowLeft}>
            <Text style={styles.listRowTitle}>
              {formatDate(leave.fromDate)} – {formatDate(leave.toDate)}
            </Text>
            <Text style={styles.remarkText}>{leave.reason}</Text>
          </View>
          <Text style={styles.statusPill}>{formatStatus(leave.status)}</Text>
        </View>
      ))}
      {leaves.length === 0 && !loading ? (
        <EmptyState icon="calendar-outline" title="No leave requests yet" message="Requests you submit will appear here." />
      ) : null}
    </View>
  );
}
