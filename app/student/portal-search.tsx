import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { computeVisibleStudentPortalModules } from '@/lib/student-portal-modules';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { styles } from '@/lib/styles';

// Filterable list rendering of the same Student Portal tiles shown in
// app/student/portal.tsx's grid — see lib/student-portal-modules.ts for the
// shared, unit-tested source of truth for what's real vs. dropped.
export default function StudentPortalSearchScreen() {
  const { role, branding, logout } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const modules = computeVisibleStudentPortalModules(hasFeature).map((module) => ({
      key: module.key,
      title: module.title,
      icon: module.icon,
      onPress: () => router.push(module.route),
    }));
    return [...modules, { key: 'logout', title: 'Logout', icon: 'log-out-outline', onPress: logout }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFeature]);

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const filtered = items.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <View style={styles.container}>
      <SubScreenHeader title="Search" color={branding.primaryColor} onBack={() => router.back()} />

      <View style={styles.searchInputWrap}>
        <View style={styles.searchInputRow}>
          <Ionicons name="search" size={18} color="#8a94a6" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor="#8a94a6"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <ScrollView>
        {filtered.map((item) => (
          <Pressable key={item.key} style={styles.searchRow} onPress={item.onPress}>
            <View style={[styles.searchRowBadge, { backgroundColor: branding.primaryColor }]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color="#fff" />
            </View>
            <Text style={styles.searchRowLabel}>{item.title}</Text>
          </Pressable>
        ))}
        {filtered.length === 0 ? <Text style={[styles.emptyText, { padding: 16 }]}>No matching items.</Text> : null}
      </ScrollView>
    </View>
  );
}
