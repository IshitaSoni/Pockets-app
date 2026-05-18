import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { freeCash } from '../domain/match';
import type { ID, Paise } from '../domain/types';
import { usePocketsStore } from '../store/store';
import { formatINRCompact as formatINR } from '../utils/currency';

export default function Rebudget() {
  const pendingSpend = usePocketsStore((s) => s.pendingSpend);
  const pockets = usePocketsStore((s) => s.pockets);
  const fc = usePocketsStore((s) => freeCash(s));
  const resolvePendingSpend = usePocketsStore((s) => s.resolvePendingSpend);
  const cancelPendingSpend = usePocketsStore((s) => s.cancelPendingSpend);

  if (!pendingSpend) return null;

  const targetPocket = pockets.find((p) => p.id === pendingSpend.pocketId);
  if (!targetPocket) return null;

  const deficit = (pendingSpend.amount - targetPocket.balance) as Paise;
  const otherPockets = pockets.filter((p) => p.id !== pendingSpend.pocketId);

  const handleResolve = (source: ID | null) => {
    resolvePendingSpend(source);
    router.back();
  };

  const handleCancel = () => {
    cancelPendingSpend();
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-6">
      <Stack.Screen options={{ title: 'Rebudget' }} />

      <Text className="text-xs text-slate-500 uppercase tracking-wider mb-1">
        {targetPocket.name} short by
      </Text>
      <Text className="text-3xl font-bold text-slate-900 mb-1">{formatINR(deficit)}</Text>
      <Text className="text-sm text-slate-500 mb-6">
        Spend {formatINR(pendingSpend.amount)} · {formatINR(targetPocket.balance)} in{' '}
        {targetPocket.name}
      </Text>

      <Text className="text-xs text-slate-500 uppercase tracking-wider mb-2">Pull from</Text>
      <Pressable
        onPress={() => handleResolve(null)}
        className="bg-slate-900 rounded-xl px-4 py-4 mb-6"
      >
        <Text className="text-white text-base font-semibold mb-1">Free Cash</Text>
        <Text className="text-slate-300 text-xs">Available · {formatINR(fc)}</Text>
      </Pressable>

      {otherPockets.length > 0 && (
        <View className="mb-6">
          <Text className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Or another pocket
          </Text>
          <View className="gap-2">
            {otherPockets.map((p) => {
              const sufficient = p.balance >= deficit;
              return (
                <Pressable
                  key={p.id}
                  onPress={sufficient ? () => handleResolve(p.id) : undefined}
                  className={`border rounded-xl px-4 py-4 flex-row justify-between items-center ${
                    sufficient
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-100 border-slate-200 opacity-50'
                  }`}
                >
                  <View>
                    <Text className="text-base font-semibold text-slate-900">{p.name}</Text>
                    {!sufficient && (
                      <Text className="text-xs text-slate-500 mt-1">Not enough for deficit</Text>
                    )}
                  </View>
                  <Text className="text-sm text-slate-600">{formatINR(p.balance)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <Pressable
        onPress={handleCancel}
        className="bg-white border border-slate-300 rounded-full py-3 items-center mb-10"
      >
        <Text className="text-slate-900 font-semibold">Cancel (treat as Free Cash)</Text>
      </Pressable>
    </ScrollView>
  );
}
