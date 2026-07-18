import { Stack } from 'expo-router';
import { ActorErrorBoundary } from '@/components/ScreenErrorFallback';

export { ActorErrorBoundary as ErrorBoundary };

export default function StudentLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="portal" options={{ headerShown: false }} />
      <Stack.Screen name="portal-search" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="timetable" options={{ headerShown: false }} />
      <Stack.Screen name="attendance" options={{ headerShown: false }} />
      <Stack.Screen name="marks" options={{ headerShown: false }} />
      <Stack.Screen name="report-cards" options={{ headerShown: false }} />
      <Stack.Screen name="announcements" options={{ headerShown: false }} />
    </Stack>
  );
}
