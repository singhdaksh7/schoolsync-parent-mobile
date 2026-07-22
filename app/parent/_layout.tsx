import { Stack } from 'expo-router';
import { ActorErrorBoundary } from '@/components/ScreenErrorFallback';
import { ParentSelectionProvider } from '@/lib/parent-selection-context';

export { ActorErrorBoundary as ErrorBoundary };

export default function ParentLayout() {
  return (
    <ParentSelectionProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="portal-search" options={{ headerShown: false }} />
        <Stack.Screen name="fees" options={{ headerShown: false }} />
        <Stack.Screen name="homework" options={{ headerShown: false }} />
        <Stack.Screen name="attendance" options={{ headerShown: false }} />
        <Stack.Screen name="marks" options={{ headerShown: false }} />
        <Stack.Screen name="report-cards" options={{ headerShown: false }} />
        <Stack.Screen name="timetable" options={{ headerShown: false }} />
        <Stack.Screen name="announcements" options={{ headerShown: false }} />
        <Stack.Screen name="transport" options={{ headerShown: false }} />
      </Stack>
    </ParentSelectionProvider>
  );
}
