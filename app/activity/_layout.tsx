import { Stack } from 'expo-router';

export default function ActivityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add" />
      <Stack.Screen name="category" />
      <Stack.Screen name="subcategory" />
      <Stack.Screen name="duration" />
    </Stack>
  );
}
