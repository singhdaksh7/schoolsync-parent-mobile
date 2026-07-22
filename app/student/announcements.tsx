import React, { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { GlassSurface } from '@/components/GlassSurface';
import { LiquidBackground } from '@/components/LiquidBackground';
import { StudentTopBar } from '@/components/StudentTopBar';
import { StudentBottomNav } from '@/components/StudentBottomNav';
import { ListSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/format';
import { Theme } from '@/constants/theme';
import { styles } from '@/lib/styles';

// Stitch "student-portal-announcements" rebuilt: feed cards (date, title,
// body, author-footer with "Read More" — expand-in-place via local state,
// not new data). Dropped: category filter chips (Academic/Events/Sports —
// AnnouncementItem has no category field) and the "Important" pin icon /
// full-bleed image-hero card variant (no importance flag or image URL in the
// data model).
export default function StudentAnnouncementsScreen() {
  const { role, branding } = useAuth();
  const dashboard = useStudentDashboard();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (role !== 'STUDENT') return <Redirect href="/" />;

  return (
    <View style={styles.liquidScreen}>
      <LiquidBackground
        blobs={[
          { color: Theme.colors.primaryContainer, size: 200, top: -60, right: -60 },
          { color: Theme.colors.secondaryContainer, size: 160, bottom: 100, left: -80 },
        ]}
      />
      <StudentTopBar title="Announcements" onBack={() => router.back()} color={branding.primaryColor} />

      <ScrollView
        contentContainerStyle={styles.liquidScrollContent}
        refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.handleRefresh} />}
      >
        {dashboard.loading && dashboard.announcements.length === 0 ? (
          <ListSkeleton items={3} />
        ) : dashboard.announcements.length === 0 ? (
          <EmptyState icon="megaphone-outline" title="No announcements yet" message="School announcements will appear here." />
        ) : (
          dashboard.announcements.map((item) => {
            const isExpanded = Boolean(expanded[item.id]);
            return (
              <GlassSurface key={item.id} style={styles.liquidAnnouncementCard} intensity={35}>
                <View style={styles.liquidAnnouncementTopRow}>
                  <Text style={styles.listRowSubtext}>{formatDate(item.publishedAt)}</Text>
                </View>
                <Text style={styles.sectionTitle}>{item.title}</Text>
                <Text style={styles.announcementBody} numberOfLines={isExpanded ? undefined : 3}>
                  {item.body}
                </Text>
                <View style={styles.liquidAnnouncementFooterRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.liquidAnnouncementAvatar, { backgroundColor: branding.primaryColor + '1a' }]}>
                      <Ionicons name="person" size={16} color={branding.primaryColor} />
                    </View>
                    <Text style={styles.listRowTitle}>{item.createdBy?.name || 'School'}</Text>
                  </View>
                  <Pressable onPress={() => setExpanded((prev) => ({ ...prev, [item.id]: !isExpanded }))}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Text style={{ color: branding.primaryColor, fontWeight: '700', fontSize: 13 }}>
                        {isExpanded ? 'Show less' : 'Read More'}
                      </Text>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'arrow-forward'} size={14} color={branding.primaryColor} />
                    </View>
                  </Pressable>
                </View>
              </GlassSurface>
            );
          })
        )}
      </ScrollView>

      <StudentBottomNav active="menu" color={branding.primaryColor} />
    </View>
  );
}
