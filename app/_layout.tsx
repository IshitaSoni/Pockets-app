import '../styles/global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View className="flex-1 items-center bg-slate-200">
        <View className="flex-1 w-full max-w-md bg-slate-50">
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
        </View>
      </View>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
