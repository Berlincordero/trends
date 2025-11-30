// app/_layout.tsx
import "react-native-gesture-handler"; // 👈 importante, una vez en la app

import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Fuerza que la primera ruta sea "index"
export const unstable_settings = {
  initialRouteName: "index",
};

const BG = "#000"; // 👉 color de fondo global de la app

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: BG }}>
        <Stack
          screenOptions={{
            headerShown: false,
            // 👉 MUY importante: fondo para TODAS las pantallas del stack
            contentStyle: { backgroundColor: BG },
          }}
        >
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
    </GestureHandlerRootView>
  );
}
