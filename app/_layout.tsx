import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Margi Hymns" }} />
      <Stack.Screen name="hymm" options={{ title: "Hymn" }} />
      <Stack.Screen name="uploadhymm" options={{ title: "Upload Hymn" }} />
      <Stack.Screen name="uploadaudio" options={{ title: "Upload Audio" }} />
      <Stack.Screen name="dashboard" options={{ title: "Admin Dashboard" }} />
    </Stack>
  );
}
