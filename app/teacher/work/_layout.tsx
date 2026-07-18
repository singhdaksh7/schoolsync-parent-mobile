import { Stack } from 'expo-router';

export default function TeacherWorkLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Work' }} />
      <Stack.Screen name="homework" options={{ headerShown: false }} />
      <Stack.Screen name="marks" options={{ title: 'Marks' }} />
      <Stack.Screen name="notebook" options={{ title: 'Notebook Checking' }} />
      <Stack.Screen name="report-cards" options={{ title: 'Report Cards' }} />
      <Stack.Screen name="leaves" options={{ title: 'Early Leave' }} />
      <Stack.Screen name="full-leave" options={{ title: 'Full Leave' }} />
    </Stack>
  );
}
