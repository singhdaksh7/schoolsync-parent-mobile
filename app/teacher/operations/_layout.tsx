import { Stack } from 'expo-router';

export default function TeacherOperationsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Operations' }} />
      <Stack.Screen name="attention" options={{ title: 'Needs Attention' }} />
      <Stack.Screen name="current-period" options={{ title: 'Current Period' }} />
      <Stack.Screen name="next-period" options={{ title: 'Next Period' }} />
      <Stack.Screen name="teacher-status" options={{ title: 'Teacher Status' }} />
      <Stack.Screen name="leaves" options={{ title: 'Leave Management' }} />
      <Stack.Screen name="uncovered-lectures" options={{ title: 'Uncovered Lectures' }} />
      <Stack.Screen name="workload" options={{ title: 'Teacher Workload' }} />
      <Stack.Screen name="activity" options={{ title: 'Activity' }} />
    </Stack>
  );
}
