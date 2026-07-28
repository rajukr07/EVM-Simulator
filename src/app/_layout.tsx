import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { COLORS } from "../constants/theme";
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      />
    </>
  );
}
