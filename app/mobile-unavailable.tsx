import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BrandHeader } from '@/components/BrandHeader';
import { useAuth } from '@/lib/auth-context';
import { styles } from '@/lib/styles';

// Shown when the school's MOBILE_APP feature flag is off. The backend
// session stays intact — this is a channel-availability state, not an auth
// failure, so we never clear the session here. A pull-to-refresh-free manual
// "Check again" lets the user recover instantly once the school re-enables
// mobile access, without forcing a fresh login.
export default function MobileUnavailableScreen() {
  const { branding, loadingBranding, logout } = useAuth();
  const theme = { backgroundColor: branding.primaryColor };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, theme]}>
        <BrandHeader branding={branding} loading={loadingBranding} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mobile app unavailable</Text>
        <Text style={styles.emptyText}>
          Mobile access is currently turned off for your school. Please contact your school administrator, or check
          again later.
        </Text>
        <Pressable style={[styles.primaryButton, theme]} onPress={logout}>
          <Text style={styles.primaryButtonText}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
