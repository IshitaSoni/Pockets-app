import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { freeCash } from '../domain/match';
import { usePocketsStore } from '../store/store';
import { formatINRCompact as formatINR } from '../utils/currency';

export default function Home() {
  const totalBalance = usePocketsStore((s) => s.totalBalance);
  const pockets = usePocketsStore((s) => s.pockets);
  const pendingAttribution = usePocketsStore((s) => s.pendingAttribution);
  const fc = usePocketsStore((s) => freeCash(s));

  const isOverdrawn = fc < 0;
  const isFresh = totalBalance === 0 && pockets.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1">
        {pendingAttribution && (
          <Pressable className="bg-amber-100 border-b border-amber-200 px-6 py-4">
            <Text className="text-sm font-semibold text-amber-900">
              Debit detected: {formatINR(pendingAttribution.amount)}
            </Text>
            <Text className="text-xs text-amber-700 mt-1">
              Tap to allocate, or dismiss to Free Cash.
            </Text>
          </Pressable>
        )}

        {isFresh ? (
          <View className="flex-1 items-center justify-center px-6 py-20">
            <Text className="text-3xl font-bold text-slate-900 mb-2">Welcome to Pockets</Text>
            <Text className="text-base text-slate-600 text-center mb-8 max-w-xs">
              Set your bank balance to start carving it into pockets.
            </Text>
            <Pressable
              onPress={() => router.push('/set-balance')}
              className="bg-slate-900 px-6 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Set bank balance</Text>
            </Pressable>
          </View>
        ) : (
          <View className="px-6 pt-8 pb-10">
            <Text className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Free Cash
            </Text>
            <Text
              className={`text-4xl font-bold mb-2 ${
                isOverdrawn ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {formatINR(fc)}
            </Text>
            <Text className="text-sm text-slate-500 mb-8">
              Actual Balance · {formatINR(totalBalance)}
            </Text>

            {isOverdrawn && (
              <View className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
                <Text className="text-sm font-semibold text-rose-900 mb-1">
                  Free Cash is overdrawn
                </Text>
                <Text className="text-xs text-rose-700">
                  Reallocate from a pocket to bring Free Cash back to zero.
                </Text>
              </View>
            )}

            <Text className="text-xs text-slate-500 uppercase tracking-wider mb-3">
              Pockets
            </Text>

            {pockets.length === 0 ? (
              <View className="bg-white border border-slate-200 rounded-xl p-6 items-center">
                <Text className="text-base text-slate-600 mb-4 text-center">
                  No pockets yet. Carve out your first allocation.
                </Text>
                <Pressable
                  onPress={() => router.push('/add-pocket')}
                  className="bg-slate-900 px-5 py-3 rounded-full"
                >
                  <Text className="text-white font-semibold">Add your first pocket</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-2">
                {pockets.map((p) => (
                  <View
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-4 flex-row justify-between items-center"
                  >
                    <Text className="text-base font-semibold text-slate-900">{p.name}</Text>
                    <Text className="text-base font-semibold text-slate-900">
                      {formatINR(p.balance)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row gap-3 mt-8">
              <Pressable
                onPress={() => router.push('/add-pocket')}
                className="flex-1 bg-white border border-slate-300 rounded-full py-3 items-center"
              >
                <Text className="text-slate-900 font-semibold">Add pocket</Text>
              </Pressable>
              <Pressable className="flex-1 bg-slate-900 rounded-full py-3 items-center">
                <Text className="text-white font-semibold">Record transaction</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
