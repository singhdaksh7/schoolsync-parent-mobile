import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import type { Branding } from '@/lib/types';

// EXPO_PUBLIC_APP_ENV is set only on non-production EAS build profiles (see
// eas.json's "preview" profile) — used purely to render a visible reminder
// that this build talks to the pilot/staging backend, never production data.
const IS_PILOT_BUILD = process.env.EXPO_PUBLIC_APP_ENV === 'pilot';

function PilotBadge() {
  if (!IS_PILOT_BUILD) return null;
  return (
    <View style={styles.pilotBadge}>
      <Text style={styles.pilotBadgeText}>PILOT</Text>
    </View>
  );
}

export function BrandHeader({ branding, loading }: { branding: Branding; loading: boolean }) {
  return (
    <View style={styles.brandRow}>
      {branding.logoUrl ? (
        <Image source={{ uri: branding.logoUrl }} style={styles.logo} />
      ) : (
        <View style={styles.logoFallback}>
          <Text style={styles.logoText}>S</Text>
        </View>
      )}
      <View style={styles.brandText}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.title}>{branding.appName}</Text>
          <PilotBadge />
        </View>
        <Text style={styles.subtitle}>{loading ? 'Loading school branding...' : branding.schoolName}</Text>
        {branding.poweredBySchoolSync ? <Text style={styles.poweredBy}>Powered by SchoolSync</Text> : null}
      </View>
    </View>
  );
}

export function ActorHeader({
  branding,
  userName,
  roleLabel,
  onLogout,
}: {
  branding: Branding;
  userName: string;
  roleLabel: string;
  onLogout: () => void;
}) {
  const theme = { backgroundColor: branding.primaryColor };
  return (
    <View style={[styles.header, theme]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={styles.title}>{branding.appName}</Text>
        <PilotBadge />
      </View>
      <Text style={styles.subtitle}>Welcome, {userName}</Text>
      <View style={styles.headerActions}>
        <Text style={styles.rolePill}>{roleLabel}</Text>
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}
