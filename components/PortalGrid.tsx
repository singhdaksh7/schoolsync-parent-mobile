import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '@/lib/styles';

export type PortalModule = {
  key: string;
  title: string;
  icon: string;
  route: string;
};

/**
 * Shared 3-column icon-tile grid, used as the landing screen for all three
 * portals (Student/Parent/Teacher) — factored out of the Student Portal grid
 * built in PR #2 (app/student/portal.tsx) so Parent/Teacher reuse the same
 * header, tile, and logout-tile markup instead of three copies.
 */
export function PortalGrid({
  title,
  color,
  modules,
  onNavigate,
  onSearch,
  onLogout,
  header,
  refreshing,
  onRefresh,
}: {
  title: string;
  color: string;
  modules: PortalModule[];
  onNavigate: (route: string) => void;
  onSearch: () => void;
  onLogout: () => void;
  header?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.container}
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined}
    >
      <View style={[styles.subScreenHeader, { backgroundColor: color, paddingTop: insets.top + styles.subScreenHeader.paddingVertical }]}>
        <Text style={styles.subScreenHeaderTitle}>{title}</Text>
        <View style={styles.subScreenHeaderActions}>
          <Pressable onPress={onSearch} hitSlop={10}>
            <Ionicons name="search" size={22} color="#fff" />
          </Pressable>
          <Pressable onPress={onLogout} hitSlop={10}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      {header}

      <View style={styles.portalGrid}>
        {modules.map((module) => (
          <Pressable key={module.key} style={styles.portalTile} onPress={() => onNavigate(module.route)}>
            <View style={[styles.portalTileBadge, { backgroundColor: color }]}>
              <Ionicons name={module.icon as keyof typeof Ionicons.glyphMap} size={26} color="#fff" />
            </View>
            <Text style={styles.portalTileLabel}>{module.title}</Text>
          </Pressable>
        ))}

        <Pressable key="logout" style={styles.portalTile} onPress={onLogout}>
          <View style={[styles.portalTileBadge, { backgroundColor: color }]}>
            <Ionicons name="log-out-outline" size={26} color="#fff" />
          </View>
          <Text style={styles.portalTileLabel}>Logout</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
