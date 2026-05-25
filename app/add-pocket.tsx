import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { freeCash } from '../domain/match';
import { usePocketsStore } from '../store/store';
import { formatINRCompact as formatINR, rupeesToPaise } from '../utils/currency';
import { useEscapeToClose } from '../utils/useEscapeToClose';

export default function AddPocket() {
  useEscapeToClose();
  const addPocket = usePocketsStore((s) => s.addPocket);
  const fc = usePocketsStore((s) => freeCash(s));
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Pocket needs a name');
      return;
    }
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a positive amount');
      return;
    }
    try {
      addPocket(trimmed, rupeesToPaise(num));
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add pocket');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <View className="flex-1 bg-slate-50 px-6 pt-6">
        <Stack.Screen options={{ title: 'New Pocket' }} />

        <Text className="text-xs text-slate-500 uppercase tracking-wider mb-1">Name</Text>
        <TextInput
          className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 mb-5"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError(null);
          }}
          placeholder="Travel, Groceries, ..."
          placeholderTextColor="#94a3b8"
          autoFocus
        />

        <Text className="text-xs text-slate-500 uppercase tracking-wider mb-1">Amount</Text>
        <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-4 py-3 mb-2">
          <Text className="text-2xl text-slate-500 mr-2">₹</Text>
          <TextInput
            className="flex-1 text-2xl font-semibold text-slate-900"
            value={amount}
            onChangeText={(t) => {
              setAmount(t);
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <Text className="text-xs text-slate-500 mb-2">
          Free Cash available: {formatINR(fc)}
        </Text>

        {error && <Text className="text-sm text-rose-600 mb-2">{error}</Text>}

        <Pressable
          onPress={handleSave}
          className="bg-slate-900 hover:bg-slate-800 rounded-full py-3 items-center mt-4"
        >
          <Text className="text-white font-semibold">Add Pocket</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
