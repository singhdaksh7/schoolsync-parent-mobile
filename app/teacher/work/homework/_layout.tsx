import { Stack } from 'expo-router';

export default function HomeworkStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Homework' }} />
      <Stack.Screen name="[homeworkId]" options={{ title: 'Homework Detail' }} />
    </Stack>
  );
}
