import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { styles } from '@/lib/styles';
import { Theme } from '@/constants/theme';
import type { PortalModule } from './PortalGrid';

/**
 * Shared filterable list rendering the same tiles as PortalGrid — factored
 * out of the Student Portal Search screen built in PR #2
 * (app/student/portal-search.tsx) so Parent/Teacher reuse it instead of three
 * copies.
 */
export function PortalSearch({
  color,
  modules,
  onNavigate,
  onBack,
  onLogout,
}: {
  color: string;
  modules: PortalModule[];
  onNavigate: (route: string) => void;
  onBack: () => void;
  onLogout: () => void;
}) {
  const [query, setQuery] = useState('');

  const items = useMemo(
    () => [
      ...modules.map((module) => ({ key: module.key, title: module.title, icon: module.icon, onPress: () => onNavigate(module.route) })),
      { key: 'logout', title: 'Logout', icon: 'log-out-outline', onPress: onLogout },
    ],
    [modules, onNavigate, onLogout]
  );

  const filtered = items.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <View style={styles.container}>
      <SubScreenHeader title="Search" color={color} onBack={onBack} />

      <View style={styles.searchInputWrap}>
        <View style={styles.searchInputRow}>
          <Ionicons name="search" size={18} color={Theme.colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={Theme.colors.onSurfaceVariant}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <ScrollView>
        {filtered.map((item) => (
          <Pressable key={item.key} style={styles.searchRow} onPress={item.onPress}>
            <View style={[styles.searchRowBadge, { backgroundColor: color }]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color="#fff" />
            </View>
            <Text style={styles.searchRowLabel}>{item.title}</Text>
          </Pressable>
        ))}
        {filtered.length === 0 ? <EmptyState icon="search-outline" title="No matching items" message="Try a different search term." /> : null}
      </ScrollView>
    </View>
  );
}
