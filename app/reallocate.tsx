import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { freeCash } from '../domain/match';
import type { Paise } from '../domain/types';
import { usePocketsStore } from '../store/store';
import { formatINRCompact as formatINR, rupeesToPaise } from '../utils/currency';

const FC = 'freecash';

export default function Reallocate() {
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const pockets = usePocketsStore((s) => s.pockets);
  const fc = usePocketsStore((s) => freeCash(s));
  const reallocate = usePocketsStore((s) => s.reallocate);
  const removePocket = usePocketsStore((s) => s.removePocket);

  const initialFrom = params.from || FC;
  const initialTo =
    params.to || (params.from && params.from !== FC ? FC : '');

  const [source, setSource] = useState<string>(initialFrom);
  const [target, setTarget] = useState<string>(initialTo);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmingDissolve, setConfirmingDissolve] = useState(false);

  const sourceBalance: Paise =
    source === FC
      ? fc
      : ((pockets.find((p) => p.id === source)?.balance ?? 0) as Paise);

  const handlePick = (which: 'source' | 'target', value: string) => {
    setError(null);
    if (which === 'source') {
      setSource(value);
      if (target === value) setTarget('');
    } else {
      setTarget(value);
      if (source === value) setSource('');
    }
  };

  const sourcePocket =
    source && source !== FC ? pockets.find((p) => p.id === source) : null;

  const confirmDissolve = () => {
    if (!sourcePocket) return;
    removePocket(sourcePocket.id);
    router.back();
  };

  const handleSave = () => {
    if (!source) return setError('Pick a source');
    if (!target) return setError('Pick a destination');
    if (source === target) return setError('Source and target must differ');
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) return setError('Enter a positive amount');
    try {
      const paiseAmount = rupeesToPaise(num);
      reallocate(
        paiseAmount,
        source === FC ? null : source,
        target === FC ? null : target
      );
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not move money');
    }
  };

  const renderOption = (
    which: 'source' | 'target',
    value: string,
    label: string,
    balance?: Paise
  ) => {
    const selected = (which === 'source' ? source : target) === value;
    return (
      <Pressable
        key={`${which}-${value}`}
        onPress={() => handlePick(which, value)}
        className={`rounded-xl px-4 py-3 flex-row justify-between items-center border ${
          selected ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'
        }`}
      >
        <Text
          className={`text-base font-semibold ${selected ? 'text-white' : 'text-slate-900'}`}
        >
          {label}
        </Text>
        {balance !== undefined && (
          <Text
            className={`text-sm ${selected ? 'text-slate-300' : 'text-slate-600'}`}
          >
            {formatINR(balance)}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-6">
      <Stack.Screen options={{ title: 'Move Money' }} />

      <Text className="text-xs text-slate-500 uppercase tracking-wider mb-2">From</Text>
      <View className="gap-2 mb-6">
        {renderOption('source', FC, 'Free Cash', fc)}
        {pockets.map((p) => renderOption('source', p.id, p.name, p.balance))}
      </View>

      <Text className="text-xs text-slate-500 uppercase tracking-wider mb-2">To</Text>
      <View className="gap-2 mb-6">
        {renderOption('target', FC, 'Free Cash')}
        {pockets.map((p) => renderOption('target', p.id, p.name))}
      </View>

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
          autoFocus={!!params.from && params.from !== FC}
        />
      </View>

      {source && (
        <Text className="text-xs text-slate-500 mb-2">
          Available · {formatINR(sourceBalance)}
        </Text>
      )}

      {error && <Text className="text-sm text-rose-600 mb-2">{error}</Text>}

      <Pressable
        onPress={handleSave}
        className="bg-slate-900 rounded-full py-3 items-center mt-4 mb-2"
      >
        <Text className="text-white font-semibold">Move</Text>
      </Pressable>

      {sourcePocket && (
        <View className="border-t border-slate-200 pt-6 mt-6 mb-10">
          <Pressable
            onPress={() => setConfirmingDissolve(true)}
            className="bg-white border border-rose-300 rounded-full py-3 items-center"
          >
            <Text className="text-rose-700 font-semibold">
              Dissolve {sourcePocket.name}
            </Text>
          </Pressable>
          <Text className="text-xs text-slate-500 mt-2 text-center">
            Returns {formatINR(sourcePocket.balance)} to Free Cash and removes the pocket.
          </Text>
        </View>
      )}

      <Modal
        visible={confirmingDissolve && !!sourcePocket}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingDissolve(false)}
      >
        <Pressable
          onPress={() => setConfirmingDissolve(false)}
          className="flex-1 bg-black/50 justify-center items-center px-6"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
          >
            <Text className="text-lg font-bold text-slate-900 mb-2">
              Dissolve {sourcePocket?.name}?
            </Text>
            <Text className="text-sm text-slate-600 mb-6">
              {sourcePocket && formatINR(sourcePocket.balance)} will return to Free Cash.
              This cannot be undone.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setConfirmingDissolve(false)}
                className="flex-1 bg-slate-100 rounded-full py-3 items-center"
              >
                <Text className="text-slate-900 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDissolve}
                className="flex-1 bg-rose-600 rounded-full py-3 items-center"
              >
                <Text className="text-white font-semibold">Dissolve</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
