import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/auth-context';
import { ScreenErrorFallback } from '@/components/ScreenErrorFallback';
import { clearSession } from '@/lib/session';
import { clearAllCache } from '@/lib/query-cache';
import { clearGetDedupCache } from '@/lib/api-client';
import { clearPdfCache } from '@/lib/pdf-download';

/**
 * Root-level fallback only. expo-router mounts this IN PLACE OF the whole
 * default-exported RootLayout (AuthProvider included) when something throws
 * before/outside an actor layout's own `ErrorBoundary` (e.g. during the
 * unauthenticated bootstrap). AuthProvider is gone at that point, so Sign Out
 * calls the same underlying primitives `logout()` uses directly, rather than
 * through a context that no longer exists.
 */
export function ErrorBoundary({ retry }: { error: Error; retry: () => Promise<void> }) {
  const router = useRouter();
  const handleSignOut = () => {
    clearSession().catch(() => undefined);
    clearAllCache();
    clearGetDedupCache();
    clearPdfCache().catch(() => undefined);
    router.replace('/login');
  };
  return <ScreenErrorFallback onRetry={() => void retry()} onSignOut={handleSignOut} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="parent" options={{ headerShown: false }} />
        <Stack.Screen name="teacher" options={{ headerShown: false }} />
        <Stack.Screen name="student" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="mobile-unavailable" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
