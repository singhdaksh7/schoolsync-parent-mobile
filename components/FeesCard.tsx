import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import type { PendingFeeItem } from '@/lib/types';
import { EmptyState } from './EmptyState';

// Payment (Razorpay create-order/verify-payment) intentionally removed for
// Phase 6 — this card is read-only. See docs/backend-pilot-contract-freeze.md.
export function FeesCard({ pendingFees }: { pendingFees: PendingFeeItem[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Pending Fees</Text>
      {pendingFees.slice(0, 6).map((fee) => (
        <View key={`${fee.student.id}-${fee.feeStructure.id}`} style={styles.listRow}>
          <View style={styles.listRowLeft}>
            <Text style={styles.listRowTitle}>{fee.feeStructure.name}</Text>
            <Text style={styles.listRowSubtext}>{fee.student.name}</Text>
          </View>
          <View style={styles.feeAction}>
            <Text style={styles.listRowValue}>Rs. {fee.feeStructure.amount.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      ))}
      {pendingFees.length === 0 ? (
        <EmptyState icon="cash-outline" title="No pending fees" message="Outstanding fee items will appear here." />
      ) : null}
    </View>
  );
}
