import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { usePocketsStore } from '../store/store';
import { paiseToRupees, rupeesToPaise } from '../utils/currency';

export default function SetBalance() {
  const setTotalBalance = usePocketsStore((s) => s.setTotalBalance);
  const current = usePocketsStore((s) => s.totalBalance);
  const [input, setInput] = useState(current === 0 ? '' : paiseToRupees(current).toString());
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const num = parseFloat(input);
    if (!Number.isFinite(num) || num < 0) {
      setError('Enter a valid amount');
      return;
    }
    try {
      setTotalBalance(rupeesToPaise(num));
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not set balance');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <View className="flex-1 bg-slate-50 px-6 pt-6">
        <Stack.Screen options={{ title: 'Set Bank Balance' }} />

        <Text className="text-sm text-slate-600 mb-3">
          Enter your current bank balance. Pockets will be carved out of this total.
        </Text>

        <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-4 py-3 mb-2">
          <Text className="text-2xl text-slate-500 mr-2">₹</Text>
          <TextInput
            className="flex-1 text-2xl font-semibold text-slate-900"
            value={input}
            onChangeText={(t) => {
              setInput(t);
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            autoFocus
          />
        </View>

        {error && <Text className="text-sm text-rose-600 mb-2">{error}</Text>}

        <Pressable
          onPress={handleSave}
          className="bg-slate-900 rounded-full py-3 items-center mt-4"
        >
          <Text className="text-white font-semibold">Save</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
