import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '@/lib/styles';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

type SystemStateVariant = 'crash' | 'offline' | 'not-found';

const VARIANT_COPY: Record<SystemStateVariant, { icon: keyof typeof Ionicons.glyphMap; title: string; message: string }> = {
  crash: {
    icon: 'alert-circle-outline',
    title: "SchoolSync couldn't load this screen.",
    message: 'Try again, or sign out and back in if the problem continues.',
  },
  offline: {
    icon: 'cloud-offline-outline',
    title: "You're offline.",
    message: 'Check your connection and try again.',
  },
  'not-found': {
    icon: 'search-outline',
    title: "We couldn't find that.",
    message: 'It may have been removed, or the link is out of date.',
  },
};

/**
 * Rendered in place of a crashed screen (see the `ErrorBoundary` export in
 * each actor layout / the root layout), or for other full-screen system
 * states (offline, not-found) matching the Stitch "System States" screen.
 * Deliberately shows nothing about the error itself — no stack trace, no
 * API response body, no token — since this can be reached from any
 * authenticated screen.
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
  const copy = VARIANT_COPY[variant];
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={[styles.card, styles.lastCard]}>
        <View style={styles.systemStateIconWrap}>
          <Ionicons name={copy.icon} size={30} color={Theme.colors.error} />
        </View>
        <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>{copy.title}</Text>
        <Text style={[styles.emptyText, { textAlign: 'center' }]}>{copy.message}</Text>
        <Pressable style={[styles.primaryButton, { marginTop: 14 }]} onPress={onRetry}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </Pressable>
        <Pressable style={[styles.smallButton, { alignSelf: 'center', marginTop: 10 }]} onPress={onSignOut}>
          <Text style={styles.smallButtonText}>Sign Out</Text>
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
