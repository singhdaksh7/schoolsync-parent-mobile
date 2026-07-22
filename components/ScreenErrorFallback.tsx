import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '@/lib/styles';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

// Only Stitch's two real "System States" variants — crash and offline. The
// earlier 'not-found' variant (invented last session, not in the Stitch
// design set) has been removed.
type SystemStateVariant = 'crash' | 'offline';

/**
 * Rendered in place of a crashed screen (see the `ErrorBoundary` export in
 * each actor layout / the root layout), or for an offline state matching
 * the Stitch "System States" screen. Deliberately shows nothing about the
 * error itself — no stack trace, no API response body, no token — since
 * this can be reached from any authenticated screen.
 *
 * NOTE: this component is shared by every actor (student/parent/teacher/
 * admin/root `ErrorBoundary`), not just the student portal — restyling it
 * to match Stitch necessarily changes the crash/offline screen for Parent
 * and Teacher too, since there is no separate variant to fork without
 * duplicating a system-wide primitive. Reported as required.
 */
export function ScreenErrorFallback({
  onRetry,
  onSignOut,
  variant = 'crash',
}: {
  onRetry: () => void;
  onSignOut: () => void;
  variant?: SystemStateVariant;
}) {
  if (variant === 'offline') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={[styles.card, styles.lastCard, { alignItems: 'center' }]}>
          <View style={[styles.systemStateIconWrap, { backgroundColor: Theme.colors.secondaryContainer + '33' }]}>
            <Ionicons name="cloud-offline-outline" size={30} color={Theme.colors.secondary} />
          </View>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>No connection</Text>
          <Text style={[styles.emptyText, { textAlign: 'center' }]}>
            Check your internet settings to sync your latest data.
          </Text>
          <View style={[styles.infoBox, { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginTop: 20 }]}>
            <Ionicons name="wifi-outline" size={18} color={Theme.colors.secondary} />
            <Text style={{ color: Theme.colors.onSecondaryContainer, fontSize: 13 }}>Offline mode — some data may be out of date</Text>
          </View>
          <Pressable style={[styles.primaryButton, { backgroundColor: Theme.colors.secondary, alignSelf: 'stretch', marginTop: 16 }]} onPress={onRetry}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={[styles.card, styles.lastCard, { alignItems: 'center' }]}>
        <View style={styles.systemStateIconWrap}>
          <Ionicons name="alert-circle-outline" size={30} color={Theme.colors.error} />
        </View>
        <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>SchoolSync couldn&apos;t load this screen.</Text>
        <Text style={[styles.emptyText, { textAlign: 'center' }]}>
          Try again, or sign out and back in if the problem continues.
        </Text>
        <Pressable style={[styles.primaryButton, { alignSelf: 'stretch', marginTop: 16 }]} onPress={onRetry}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </Pressable>
        <Pressable
          style={[
            styles.primaryButton,
            { alignSelf: 'stretch', marginTop: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: Theme.colors.primary + '33' },
          ]}
          onPress={onSignOut}
        >
          <Text style={[styles.primaryButtonText, { color: Theme.colors.primary }]}>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/**
 * `ErrorBoundary` export for an actor layout (app/teacher, app/parent,
 * app/student, app/admin `_layout.tsx`) — expo-router mounts this in place of
 * the crashed route subtree, catching JavaScript render exceptions only
 * (never a native process crash). Sits BELOW the root layout's AuthProvider,
 * so `useAuth()`/`useRouter()` remain available and Sign Out reuses the
 * exact same session/cache-clearing path as a normal logout.
 */
export function ActorErrorBoundary({ retry }: { error: Error; retry: () => Promise<void> }) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    router.replace('/login');
  };

  return <ScreenErrorFallback onRetry={() => void retry()} onSignOut={handleSignOut} variant="crash" />;
}
