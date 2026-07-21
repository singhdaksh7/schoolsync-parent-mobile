import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import { roleLabel } from '@/lib/format';

// The full admin Operations Command Center is session-cookie-only on the web
// app and out of mobile's reach per Phase 6 scope (see
// docs/school-operations-command-center.md). This stub keeps the existing
// staff-login path from dead-ending for admin roles.
export function AdminDashboard({ role, color }: { role: string; color: string }) {
  const cards = ['Students', 'Teachers', 'Fees', 'Attendance', 'Homework', 'Substitutions', 'Report Cards'];
  return (
    <View style={[styles.card, styles.lastCard]}>
      <Text style={styles.sectionTitle}>{roleLabel(role)} Dashboard</Text>
      <Text style={styles.emptyText}>Mobile admin overview is ready for backend summary APIs.</Text>
      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card} style={styles.overviewTile}>
            <Text style={[styles.overviewNumber, { color }]}>--</Text>
            <Text style={styles.overviewLabel}>{card}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
