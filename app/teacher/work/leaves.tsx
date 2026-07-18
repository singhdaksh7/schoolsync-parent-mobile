import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTeacherEarlyLeave } from '@/hooks/useTeacherEarlyLeave';
import { formatDate, formatStatus } from '@/lib/format';
import { styles } from '@/lib/styles';

// Early-leave (single-day, "leave after period N") only. The full multi-day
// LeaveRequest flow (/api/teacher/leaves) has no bearer-JWT route — see the
// Phase 6C report, Mobile Integration Blockers. Teacher personal leave here
// is unrelated to Teacher Operations leave approval, which belongs to a
// later Phase 6 stage.
export default function TeacherEarlyLeaveScreen() {
  const { role, branding } = useAuth();
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
      style={styles.container}
      refreshControl={<RefreshControl refreshing={earlyLeave.refreshing} onRefresh={earlyLeave.handleRefresh} />}
    >
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Early Leave Requests</Text>
          {earlyLeave.loading ? <ActivityIndicator color={branding.primaryColor} /> : null}
        </View>
        <Pressable style={[styles.primaryButton, { backgroundColor: branding.primaryColor }]} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.primaryButtonText}>{showForm ? 'Cancel' : 'New Request'}</Text>
        </Pressable>
      </View>

      {earlyLeave.error ? <Text style={styles.errorBanner}>{earlyLeave.error}</Text> : null}

      {showForm ? (
        <View style={styles.card}>
          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="2026-07-15" placeholderTextColor="#8a8a8a" value={date} onChangeText={setDate} />

          <Text style={styles.label}>Leave After Period</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 4"
            placeholderTextColor="#8a8a8a"
            keyboardType="number-pad"
            value={period}
            onChangeText={setPeriod}
          />

          <Text style={styles.label}>Reason</Text>
          <TextInput style={styles.input} placeholder="Reason for early leave" placeholderTextColor="#8a8a8a" value={reason} onChangeText={setReason} />

          <Pressable
            style={[styles.primaryButton, { backgroundColor: branding.primaryColor }, earlyLeave.creating && styles.primaryButtonDisabled]}
            onPress={handleCreate}
            disabled={earlyLeave.creating}
          >
            {earlyLeave.creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Submit</Text>}
          </Pressable>
        </View>
      ) : null}

      {earlyLeave.requests.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.listRowTitle}>{formatDate(item.date)}</Text>
            <Text style={styles.statusPill}>{formatStatus(item.status)}</Text>
          </View>
          <Text style={styles.listRowSubtext}>After period {item.leaveAfterPeriod}</Text>
          <Text style={styles.remarkText}>{item.reason}</Text>
        </View>
      ))}

      {earlyLeave.requests.length === 0 && !earlyLeave.loading ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>No early-leave requests yet.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
