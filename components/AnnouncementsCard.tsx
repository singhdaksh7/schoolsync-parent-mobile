import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import { formatDate } from '@/lib/format';
import type { AnnouncementItem } from '@/lib/types';

export function AnnouncementsCard({ announcements }: { announcements: AnnouncementItem[] }) {
  return (
    <View style={[styles.card, styles.lastCard]}>
      <Text style={styles.sectionTitle}>Announcements</Text>
      {announcements.map((item) => (
        <View key={item.id} style={styles.announcementCard}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementBody}>{item.body}</Text>
          <Text style={styles.announcementMeta}>
            {formatDate(item.publishedAt)}
            {item.createdBy?.name ? ` - ${item.createdBy.name}` : ''}
          </Text>
        </View>
      ))}
      {announcements.length === 0 ? <Text style={styles.emptyText}>No announcements yet.</Text> : null}
    </View>
  );
}
