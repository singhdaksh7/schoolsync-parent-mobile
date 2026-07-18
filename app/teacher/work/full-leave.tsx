import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTeacherFullLeave } from '@/hooks/useTeacherFullLeave';
import { formatDate, formatStatus } from '@/lib/format';
import { styles } from '@/lib/styles';

// Full multi-day leave — distinct from Early Leave (single-day, after a
// specific period). Teacher can view/create their own requests only; no
// approval/reject control exists here — that belongs to Operations leave
// management, a separate surface this screen never touches.
export default function TeacherFullLeaveScreen() {
  const { role, branding } = useAuth();
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
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={fullLeave.refreshing} onRefresh={fullLeave.handleRefresh} />}>
      <View style={[styles.header, { backgroundColor: branding.primaryColor }]}>
        <Text style={styles.title}>Full Leave</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Your Leave Requests</Text>
          {fullLeave.loading ? <ActivityIndicator color={branding.primaryColor} /> : null}
        </View>
        <Pressable style={[styles.primaryButton, { backgroundColor: branding.primaryColor }]} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.primaryButtonText}>{showForm ? 'Cancel' : 'New Request'}</Text>
        </Pressable>
      </View>

      {fullLeave.error ? <Text style={styles.errorBanner}>{fullLeave.error}</Text> : null}

      {showForm ? (
        <View style={styles.card}>
          <Text style={styles.label}>From Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="2026-07-15" placeholderTextColor="#8a8a8a" value={fromDate} onChangeText={setFromDate} />

          <Text style={styles.label}>To Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="2026-07-18" placeholderTextColor="#8a8a8a" value={toDate} onChangeText={setToDate} />

          <Text style={styles.label}>Reason</Text>
          <TextInput style={styles.input} placeholder="Reason for leave" placeholderTextColor="#8a8a8a" value={reason} onChangeText={setReason} />

          <Pressable
            style={[styles.primaryButton, { backgroundColor: branding.primaryColor }, fullLeave.creating && styles.primaryButtonDisabled]}
            onPress={handleCreate}
            disabled={fullLeave.creating}
          >
            {fullLeave.creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Submit</Text>}
          </Pressable>
        </View>
      ) : null}

      {fullLeave.leaves.map((leave) => (
        <View key={leave.id} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.listRowTitle}>
              {formatDate(leave.fromDate)} – {formatDate(leave.toDate)}
            </Text>
            <Text style={styles.statusPill}>{formatStatus(leave.status)}</Text>
          </View>
          <Text style={styles.remarkText}>{leave.reason}</Text>
          {leave.reviewedBy ? <Text style={styles.listRowSubtext}>Reviewed by {leave.reviewedBy.name}</Text> : null}
        </View>
      ))}

      {fullLeave.leaves.length === 0 && !fullLeave.loading ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.emptyText}>No leave requests yet.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
