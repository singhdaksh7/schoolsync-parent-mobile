import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '@/lib/styles';
import { useAuth } from '@/lib/auth-context';

/**
 * Rendered in place of a crashed screen (see the `ErrorBoundary` export in
 * each actor layout / the root layout). Deliberately shows nothing about the
 * error itself — no stack trace, no API response body, no token — since this
 * can be reached from any authenticated screen.
 */
export function ScreenErrorFallback({ onRetry, onSignOut }: { onRetry: () => void; onSignOut: () => void }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={[styles.card, styles.lastCard]}>
        <Text style={styles.sectionTitle}>SchoolSync couldn&apos;t load this screen.</Text>
        <Text style={styles.emptyText}>Try again, or sign out and back in if the problem continues.</Text>
        <Pressable style={[styles.primaryButton, { backgroundColor: '#1976D2', marginTop: 14 }]} onPress={onRetry}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </Pressable>
        <Pressable style={[styles.smallButton, { alignSelf: 'flex-start', marginTop: 10 }]} onPress={onSignOut}>
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

  return <ScreenErrorFallback onRetry={() => void retry()} onSignOut={handleSignOut} />;
}
