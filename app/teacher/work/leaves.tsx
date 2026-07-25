import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTeacherEarlyLeave } from '@/hooks/useTeacherEarlyLeave';
import { formatDate, formatStatus } from '@/lib/format';
import { styles } from '@/lib/styles';
import { TeacherTheme } from '@/constants/theme';

const tc = TeacherTheme.colors;

// Early-leave (single-day, "leave after period N") only. The full multi-day
// LeaveRequest flow (/api/teacher/leaves) has no bearer-JWT route — see the
// Phase 6C report, Mobile Integration Blockers. Teacher personal leave here
// is unrelated to Teacher Operations leave approval, which belongs to a
// later Phase 6 stage.
export default function TeacherEarlyLeaveScreen() {
  const { role } = useAuth();
  const earlyLeave = useTeacherEarlyLeave();

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState('');
  const [reason, setReason] = useState('');

  if (role !== 'TEACHER') return <Redirect href="/" />;

  async function handleCreate() {
    const leaveAfterPeriod = Number(period);
    if (!date.trim() || Number.isNaN(leaveAfterPeriod) || !reason.trim()) return;
    const ok = await earlyLeave.createRequest({ date: date.trim(), leaveAfterPeriod, reason: reason.trim() });
    if (ok) {
      setShowForm(false);
      setDate('');
      setPeriod('');
      setReason('');
    }
  }

  return (
    <ScrollView
      style={styles.teacherScreen}
      refreshControl={<RefreshControl refreshing={earlyLeave.refreshing} onRefresh={earlyLeave.handleRefresh} />}
    >
      <View style={styles.teacherCard}>
        <View style={styles.teacherCardHeaderRow}>
          <Text style={styles.teacherSectionTitle}>Early Leave Requests</Text>
          {earlyLeave.loading ? <ActivityIndicator color={tc.primary} /> : null}
        </View>
        <Pressable style={[styles.teacherPrimaryButton, { backgroundColor: tc.primary, marginTop: 12 }]} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.teacherPrimaryButtonText}>{showForm ? 'Cancel' : 'New Request'}</Text>
        </Pressable>
      </View>

      {earlyLeave.error ? <Text style={styles.errorBanner}>{earlyLeave.error}</Text> : null}

      {showForm ? (
        <View style={styles.teacherCard}>
          <Text style={styles.teacherInputLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.teacherInput} placeholder="2026-07-15" placeholderTextColor={tc.onSurfaceVariant} value={date} onChangeText={setDate} />

          <Text style={styles.teacherInputLabel}>Leave After Period</Text>
          <TextInput
            style={styles.teacherInput}
            placeholder="e.g. 4"
            placeholderTextColor={tc.onSurfaceVariant}
            keyboardType="number-pad"
            value={period}
            onChangeText={setPeriod}
          />

          <Text style={styles.teacherInputLabel}>Reason</Text>
          <TextInput style={styles.teacherInput} placeholder="Reason for early leave" placeholderTextColor={tc.onSurfaceVariant} value={reason} onChangeText={setReason} />

          <Pressable
            style={[styles.teacherPrimaryButton, { backgroundColor: tc.primary, marginTop: 12 }, earlyLeave.creating && styles.teacherPrimaryButtonDisabled]}
            onPress={handleCreate}
            disabled={earlyLeave.creating}
          >
            {earlyLeave.creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.teacherPrimaryButtonText}>Submit</Text>}
          </Pressable>
        </View>
      ) : null}

      {earlyLeave.requests.map((item) => (
        <View key={item.id} style={styles.teacherCard}>
          <View style={styles.teacherCardHeaderRow}>
            <Text style={styles.teacherListRowTitle}>{formatDate(item.date)}</Text>
            <Text style={[styles.teacherPill, styles.teacherPillMuted]}>{formatStatus(item.status)}</Text>
          </View>
          <Text style={styles.teacherListRowSubtext}>After period {item.leaveAfterPeriod}</Text>
          <Text style={styles.teacherMeta}>{item.reason}</Text>
        </View>
      ))}

      {earlyLeave.requests.length === 0 && !earlyLeave.loading ? (
        <View style={[styles.teacherCard, styles.teacherLastCard]}>
          <Text style={styles.teacherEmptyText}>No early-leave requests yet.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
