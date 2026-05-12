import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { usePocketsStore } from '../store/store';
import { rupeesToPaise } from '../utils/currency';

type Kind = 'debit' | 'credit';

export default function RecordTransaction() {
  const recordIncomingDebit = usePocketsStore((s) => s.recordIncomingDebit);
  const deposit = usePocketsStore((s) => s.deposit);

  const [kind, setKind] = useState<Kind>('debit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a positive amount');
      return;
    }
    try {
      const paiseAmount = rupeesToPaise(num);
      const desc = description.trim() || undefined;
      if (kind === 'debit') {
        recordIncomingDebit(paiseAmount, desc);
      } else {
        deposit(paiseAmount, null, desc);
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record');
    }
  };

  return (
    <View className="flex-1 bg-slate-50 px-6 pt-6">
      <Stack.Screen options={{ title: 'Record Transaction' }} />

      <View className="flex-row bg-slate-200 rounded-full p-1 mb-6">
        <Pressable
          onPress={() => setKind('debit')}
          className={`flex-1 py-2 rounded-full items-center ${
            kind === 'debit' ? 'bg-white' : ''
          }`}
        >
          <Text
            className={`font-semibold ${
              kind === 'debit' ? 'text-slate-900' : 'text-slate-500'
            }`}
          >
            Debit
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setKind('credit')}
          className={`flex-1 py-2 rounded-full items-center ${
            kind === 'credit' ? 'bg-white' : ''
          }`}
        >
          <Text
            className={`font-semibold ${
              kind === 'credit' ? 'text-slate-900' : 'text-slate-500'
            }`}
          >
            Credit
          </Text>
        </Pressable>
      </View>

      <Text className="text-xs text-slate-500 uppercase tracking-wider mb-1">Amount</Text>
      <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-4 py-3 mb-5">
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
          autoFocus
        />
      </View>

      <Text className="text-xs text-slate-500 uppercase tracking-wider mb-1">Note (optional)</Text>
      <TextInput
        className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 mb-2"
        value={description}
        onChangeText={(t) => {
          setDescription(t);
          setError(null);
        }}
        placeholder="ATM, dress shop, salary..."
        placeholderTextColor="#94a3b8"
      />

      {error && <Text className="text-sm text-rose-600 mb-2">{error}</Text>}

      <Pressable
        onPress={handleSave}
        className="bg-slate-900 rounded-full py-3 items-center mt-4"
      >
        <Text className="text-white font-semibold">Save</Text>
      </Pressable>
    </View>
  );
}
