import '../styles/global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="pocket/[id]" options={{ headerShown: true }} />
        <Stack.Screen
          name="set-balance"
          options={{ presentation: 'modal', headerShown: true }}
        />
        <Stack.Screen
          name="add-pocket"
          options={{ presentation: 'modal', headerShown: true }}
        />
        <Stack.Screen
          name="record-transaction"
          options={{ presentation: 'modal', headerShown: true }}
        />
        <Stack.Screen
          name="attribute"
          options={{ presentation: 'modal', headerShown: true }}
        />
        <Stack.Screen
          name="rebudget"
          options={{ presentation: 'modal', headerShown: true }}
        />
        <Stack.Screen
          name="reallocate"
          options={{ presentation: 'modal', headerShown: true }}
        />
        <Stack.Screen
          name="settings"
          options={{ presentation: 'modal', headerShown: true }}
        />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
