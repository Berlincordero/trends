// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Fuerza que la primera ruta sea "index"
export const unstable_settings = {
  initialRouteName: "index",
};

export default function Layout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="feed" />
        <Stack.Screen name="compose" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="cookies" />
        <Stack.Screen name="terms" />
      </Stack>
    </SafeAreaProvider>
  );
}
