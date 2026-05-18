import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { suggestAttribution } from '../domain/match';
import type { ID } from '../domain/types';
import { usePocketsStore } from '../store/store';
import { formatINRCompact as formatINR } from '../utils/currency';

export default function Attribute() {
  const pendingAttribution = usePocketsStore((s) => s.pendingAttribution);
  const pockets = usePocketsStore((s) => s.pockets);
  const attributePending = usePocketsStore((s) => s.attributePending);

  if (!pendingAttribution) return null;

  const suggestion = suggestAttribution(pendingAttribution.amount, pockets);
  const suggestedId = suggestion?.kind === 'single' ? suggestion.pocketId : null;
  const suggestedPocket = suggestedId ? pockets.find((p) => p.id === suggestedId) : null;
  const otherPockets = pockets.filter((p) => p.id !== suggestedId);

  const handlePick = (target: ID | null) => {
    attributePending(target);
    if (usePocketsStore.getState().pendingSpend) {
      router.replace('/rebudget');
    } else {
      router.back();
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-6">
      <Stack.Screen options={{ title: 'Allocate Debit' }} />

      <Text className="text-xs text-slate-500 uppercase tracking-wider mb-1">Debit</Text>
      <Text className="text-3xl font-bold text-slate-900 mb-1">
        {formatINR(pendingAttribution.amount)}
      </Text>
      {pendingAttribution.description ? (
        <Text className="text-sm text-slate-500 mb-6">{pendingAttribution.description}</Text>
      ) : (
        <View className="mb-6" />
      )}

      {suggestedPocket && (
        <View className="mb-6">
          <Text className="text-xs text-slate-500 uppercase tracking-wider mb-2">Suggested</Text>
          <Pressable
            onPress={() => handlePick(suggestedPocket.id)}
            className="bg-slate-900 rounded-xl px-4 py-4"
          >
            <Text className="text-white text-base font-semibold mb-1">
              From {suggestedPocket.name}
            </Text>
            <Text className="text-slate-300 text-xs">
              Balance · {formatINR(suggestedPocket.balance)}
            </Text>
          </Pressable>
        </View>
      )}

      {otherPockets.length > 0 && (
        <View className="mb-6">
          <Text className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            {suggestedPocket ? 'Or pick another' : 'Pockets'}
          </Text>
          <View className="gap-2">
            {otherPockets.map((p) => {
              const sufficient = p.balance >= pendingAttribution.amount;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => handlePick(p.id)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-4 flex-row justify-between items-center"
                >
                  <View>
                    <Text className="text-base font-semibold text-slate-900">{p.name}</Text>
                    {!sufficient && (
                      <Text className="text-xs text-amber-700 mt-1">Will need rebudget</Text>
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
        onPress={() => handlePick(null)}
        className="bg-white border border-slate-300 rounded-full py-3 items-center mb-10"
      >
        <Text className="text-slate-900 font-semibold">It was uncategorized (Free Cash)</Text>
      </Pressable>
    </ScrollView>
  );
}
