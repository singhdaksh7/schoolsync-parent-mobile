import React, { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useStudentLeave } from '@/hooks/useStudentLeave';
import { GlassSurface } from '@/components/GlassSurface';
import { LiquidBackground } from '@/components/LiquidBackground';
import { StudentTopBar } from '@/components/StudentTopBar';
import { StudentBottomNav } from '@/components/StudentBottomNav';
import { ListSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, formatStatus } from '@/lib/format';
import { Theme } from '@/constants/theme';
import { styles } from '@/lib/styles';

const STATUS_COLOR: Record<string, string> = {
  PENDING: Theme.colors.warning,
  APPROVED: Theme.colors.success,
  REJECTED: Theme.colors.error,
};

function durationDays(fromDate: string, toDate: string) {
  const from = new Date(fromDate).getTime();
  const to = new Date(toDate).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.max(1, Math.round((to - from) / 86400000) + 1);
}

// Stitch "student-portal-leave-requests" given its own route (previously
// rendered inline on the dashboard with no route of its own). Form is
// always-visible per Stitch (the old inline card toggled it behind a "New
// Request" button — dropped the toggle to match). "Duration" is computed
// client-side from fromDate/toDate, not new data. Dropped: "Submitted X ago"
// relative time and the Type column on read — StudentLeave (GET response)
// has no createdAt and doesn't return leaveType, only reason/fromDate/
// toDate/status/reviewedBy. No native <select>/date-picker equivalent is
// wired up here (same as before this rebuild) — leave type and dates stay
// free-text inputs.
export default function StudentLeaveScreen() {
  const { role, branding } = useAuth();
  const leave = useStudentLeave();
  const router = useRouter();
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  if (role !== 'STUDENT') return <Redirect href="/" />;

  async function handleSubmit() {
    if (!leaveType.trim() || !reason.trim() || !fromDate.trim() || !toDate.trim()) return;
    const ok = await leave.createLeave({ leaveType: leaveType.trim(), reason: reason.trim(), fromDate: fromDate.trim(), toDate: toDate.trim() });
    if (ok) {
      setLeaveType('');
      setFromDate('');
      setToDate('');
      setReason('');
    }
  }

  function handleReset() {
    setLeaveType('');
    setFromDate('');
    setToDate('');
    setReason('');
  }

  return (
    <View style={styles.liquidScreen}>
      <LiquidBackground
        blobs={[
          { color: Theme.colors.primaryContainer, size: 200, top: -60, right: -60 },
          { color: Theme.colors.secondaryContainer, size: 160, bottom: 100, left: -80 },
        ]}
      />
      <StudentTopBar title="Leave Requests" onBack={() => router.back()} color={branding.primaryColor} />

      <ScrollView
        contentContainerStyle={styles.liquidScrollContent}
        refreshControl={<RefreshControl refreshing={leave.refreshing} onRefresh={leave.handleRefresh} />}
      >
        <GlassSurface style={{ padding: Theme.spacing.lg }} glow>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Theme.spacing.lg }}>
            <Ionicons name="calendar-outline" size={20} color={branding.primaryColor} />
            <Text style={styles.sectionTitle}>New Leave Request</Text>
          </View>

          <View style={styles.liquidFormRow}>
            <View style={styles.liquidFormField}>
              <Text style={styles.liquidFormLabel}>From Date</Text>
              <TextInput
                style={styles.liquidFormInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Theme.colors.onSurfaceVariant}
                value={fromDate}
                onChangeText={setFromDate}
              />
            </View>
            <View style={styles.liquidFormField}>
              <Text style={styles.liquidFormLabel}>To Date</Text>
              <TextInput
                style={styles.liquidFormInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Theme.colors.onSurfaceVariant}
                value={toDate}
                onChangeText={setToDate}
              />
            </View>
          </View>

          <Text style={[styles.liquidFormLabel, { marginTop: Theme.spacing.md }]}>Leave Type</Text>
          <TextInput
            style={styles.liquidFormInput}
            placeholder="e.g. Sick, Family Emergency"
            placeholderTextColor={Theme.colors.onSurfaceVariant}
            value={leaveType}
            onChangeText={setLeaveType}
          />

          <Text style={[styles.liquidFormLabel, { marginTop: Theme.spacing.md }]}>Reason</Text>
          <TextInput
            style={[styles.liquidFormInput, { minHeight: 90, textAlignVertical: 'top' }]}
            placeholder="Briefly describe why you are requesting leave..."
            placeholderTextColor={Theme.colors.onSurfaceVariant}
            value={reason}
            onChangeText={setReason}
            multiline
          />

          {leave.error ? <Text style={[styles.errorText, { marginTop: Theme.spacing.md }]}>{leave.error}</Text> : null}

          <View style={{ flexDirection: 'row', gap: Theme.spacing.sm, marginTop: Theme.spacing.lg, justifyContent: 'flex-end' }}>
            <Pressable style={[styles.smallButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: branding.primaryColor }]} onPress={handleReset}>
              <Text style={{ color: branding.primaryColor, fontWeight: '700' }}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: branding.primaryColor, marginTop: 0, paddingHorizontal: Theme.spacing.lg, flex: undefined }]}
              onPress={handleSubmit}
              disabled={leave.creating}
            >
              {leave.creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Submit Request</Text>}
            </Pressable>
          </View>
        </GlassSurface>

        <Text style={styles.liquidSectionTitle}>Past Requests</Text>
        {leave.loading && leave.leaves.length === 0 ? (
          <ListSkeleton items={2} />
        ) : leave.leaves.length === 0 ? (
          <EmptyState icon="calendar-outline" title="No leave requests yet" message="Requests you submit will appear here." />
        ) : (
          <GlassSurface style={{ padding: Theme.spacing.md }}>
            <View style={styles.liquidTableHeaderRow}>
              <Text style={[styles.liquidTableHeaderCell, { flex: 2 }]}>Date Range</Text>
              <Text style={[styles.liquidTableHeaderCell, { flex: 1 }]}>Duration</Text>
              <Text style={[styles.liquidTableHeaderCell, { flex: 1, textAlign: 'right' }]}>Status</Text>
            </View>
            {leave.leaves.map((item) => {
              const days = durationDays(item.fromDate, item.toDate);
              const color = STATUS_COLOR[item.status] || Theme.colors.onSurfaceVariant;
              return (
                <View key={item.id} style={styles.liquidTableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.liquidTableCellPrimary}>
                      {formatDate(item.fromDate)} - {formatDate(item.toDate)}
                    </Text>
                    <Text style={styles.liquidTableCellSecondary} numberOfLines={1}>{item.reason}</Text>
                  </View>
                  <Text style={[styles.liquidTableCellPrimary, { flex: 1 }]}>{days ? `${days}d` : '—'}</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View style={[styles.liquidStatusDotPill, { borderColor: color + '33', backgroundColor: color + '1a' }]}>
                      <View style={[styles.liquidStatusDot, { backgroundColor: color }]} />
                      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{formatStatus(item.status)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </GlassSurface>
        )}
      </ScrollView>

      <StudentBottomNav active="schedule" color={branding.primaryColor} />
    </View>
  );
}
