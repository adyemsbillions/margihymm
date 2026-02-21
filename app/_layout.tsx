// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect } from "react";
import { syncAllHymns } from "../utils/offlineSync"; // ← adjust path if needed

export default function Layout() {
  useEffect(() => {
    // Run the full sync when the app starts
    // silent: true  → no console spam in production
    // You can later add logic to run it only once per day / per week
    syncAllHymns({ silent: true }).catch((err) => {
      console.error("Initial offline sync failed:", err);
    });

    // Optional: you could add a periodic sync (e.g. every 24 hours)
    // const interval = setInterval(() => {
    //   syncAllHymns({ silent: true });
    // }, 24 * 60 * 60 * 1000);
    // return () => clearInterval(interval);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false, // ← hide default header for clean look
        // You can override per-screen later if needed
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Margi Hymns",
          // headerShown: true,       // ← uncomment if you want header sometimes
        }}
      />
      <Stack.Screen
        name="hymm"
        options={{
          title: "Hymn",
          // presentation: 'modal',   // ← optional: full screen modal feel
        }}
      />
      <Stack.Screen name="uploadhymm" options={{ title: "Upload Hymn" }} />
      <Stack.Screen name="uploadaudio" options={{ title: "Upload Audio" }} />
      <Stack.Screen name="dashboard" options={{ title: "Admin Dashboard" }} />
      {/* Add other screens here when created */}
      {/* <Stack.Screen name="edithymm" options={{ title: "Edit Hymn" }} /> */}
    </Stack>
  );
}
