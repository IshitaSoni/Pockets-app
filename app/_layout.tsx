import '../styles/global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="set-balance"
          options={{ presentation: 'modal', headerShown: true }}
        />
        <Stack.Screen
          name="add-pocket"
          options={{ presentation: 'modal', headerShown: true }}
        />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
