import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionRow } from '../components/TransactionRow';
import { freeCash } from '../domain/match';
import { usePocketsStore } from '../store/store';
import { formatINRCompact as formatINR } from '../utils/currency';

const RECENT_LIMIT = 10;

export default function Home() {
  const totalBalance = usePocketsStore((s) => s.totalBalance);
  const pockets = usePocketsStore((s) => s.pockets);
  const transactions = usePocketsStore((s) => s.transactions);
  const pendingAttribution = usePocketsStore((s) => s.pendingAttribution);
  const pendingSpend = usePocketsStore((s) => s.pendingSpend);
  const fc = usePocketsStore((s) => freeCash(s));

  const isOverdrawn = fc < 0;
  const isFresh = totalBalance === 0 && pockets.length === 0;
  const pendingSpendPocket = pendingSpend
    ? pockets.find((p) => p.id === pendingSpend.pocketId)
    : null;

  const recentTransactions = [...transactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, RECENT_LIMIT);
  const pocketById = new Map(pockets.map((p) => [p.id, p]));

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen options={{ title: 'Pockets' }} />
      <ScrollView className="flex-1">
        {pendingAttribution && (
          <Pressable
            onPress={() => router.push('/attribute')}
            className="bg-amber-100 hover:bg-amber-200 border-b border-amber-200 px-6 py-4"
          >
            <Text className="text-sm font-semibold text-amber-900">
              Debit detected: {formatINR(pendingAttribution.amount)}
            </Text>
            <Text className="text-xs text-amber-700 mt-1">
              Tap to allocate, or dismiss to Free Cash.
            </Text>
          </Pressable>
        )}

        {pendingSpend && pendingSpendPocket && (
          <Pressable
            onPress={() => router.push('/rebudget')}
            className="bg-rose-100 hover:bg-rose-200 border-b border-rose-200 px-6 py-4"
          >
            <Text className="text-sm font-semibold text-rose-900">
              Rebudget {formatINR(pendingSpend.amount)} from {pendingSpendPocket.name}
            </Text>
            <Text className="text-xs text-rose-700 mt-1">
              Tap to pick a source for the deficit.
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
              className="bg-slate-900 hover:bg-slate-800 px-6 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Set bank balance</Text>
            </Pressable>
          </View>
        ) : (
          <View className="px-6 pt-8 pb-10">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs text-slate-500 uppercase tracking-wider">
                Free Cash
              </Text>
              <Pressable onPress={() => router.push('/settings')}>
                <Text className="text-sm text-slate-500 underline">Settings</Text>
              </Pressable>
            </View>
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
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/reallocate', params: { to: 'freecash' } })
                }
                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl p-4 mb-6"
              >
                <Text className="text-sm font-semibold text-rose-900 mb-1">
                  Free Cash is overdrawn
                </Text>
                <Text className="text-xs text-rose-700">
                  Tap to pull from a pocket and bring Free Cash back to zero.
                </Text>
              </Pressable>
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
                  className="bg-slate-900 hover:bg-slate-800 px-5 py-3 rounded-full"
                >
                  <Text className="text-white font-semibold">Add your first pocket</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-2">
                {pockets.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => router.push({ pathname: '/pocket/[id]', params: { id: p.id } })}
                    className="bg-white hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-4 flex-row justify-between items-center"
                  >
                    <Text className="text-base font-semibold text-slate-900">{p.name}</Text>
                    <Text className="text-base font-semibold text-slate-900">
                      {formatINR(p.balance)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View className="flex-row gap-3 mt-8">
              <Pressable
                onPress={() => router.push('/add-pocket')}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-full py-3 items-center"
              >
                <Text className="text-slate-900 font-semibold">Add pocket</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/record-transaction')}
                className="flex-1 bg-slate-900 hover:bg-slate-800 rounded-full py-3 items-center"
              >
                <Text className="text-white font-semibold">Record transaction</Text>
              </Pressable>
            </View>

            {recentTransactions.length > 0 && (
              <View className="mt-10">
                <Text className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Recent
                </Text>
                <View className="gap-2">
                  {recentTransactions.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      pocket={tx.pocketId ? pocketById.get(tx.pocketId) ?? null : null}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
