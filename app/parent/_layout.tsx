import { Stack } from 'expo-router';
import { ActorErrorBoundary } from '@/components/ScreenErrorFallback';

export { ActorErrorBoundary as ErrorBoundary };

export default function ParentLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
