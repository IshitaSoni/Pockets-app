import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { TransactionRow } from '../../components/TransactionRow';
import { usePocketsStore } from '../../store/store';
import { formatINRCompact } from '../../utils/currency';

export default function PocketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pocket = usePocketsStore((s) => s.pockets.find((p) => p.id === id));
  const transactions = usePocketsStore((s) => s.transactions);
  const renamePocket = usePocketsStore((s) => s.renamePocket);
  const removePocket = usePocketsStore((s) => s.removePocket);

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [confirmingDissolve, setConfirmingDissolve] = useState(false);

  if (!pocket) {
    // Pocket was dissolved or doesn't exist; back to dashboard.
    router.back();
    return null;
  }

  const ownedTransactions = transactions
    .filter((tx) => tx.pocketId === pocket.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const startRename = () => {
    setNameDraft(pocket.name);
    setEditing(true);
  };

  const saveRename = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== pocket.name) {
      renamePocket(pocket.id, trimmed);
    }
    setEditing(false);
  };

  const cancelRename = () => {
    setEditing(false);
    setNameDraft('');
  };

  const confirmDissolve = () => {
    removePocket(pocket.id);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-slate-50 px-6 pt-6">
        <Stack.Screen options={{ title: pocket.name, headerShown: true }} />

      {editing ? (
        <View className="mb-1">
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            autoFocus
            className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-2xl font-bold text-slate-900 mb-3"
            placeholderTextColor="#94a3b8"
          />
          <View className="flex-row gap-2">
            <Pressable
              onPress={cancelRename}
              className="flex-1 bg-slate-100 hover:bg-slate-200 rounded-full py-2 items-center"
            >
              <Text className="text-slate-900 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={saveRename}
              className="flex-1 bg-slate-900 hover:bg-slate-800 rounded-full py-2 items-center"
            >
              <Text className="text-white font-semibold">Save</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-3xl font-bold text-slate-900">{pocket.name}</Text>
          <Pressable onPress={startRename}>
            <Text className="text-sm text-slate-500 underline">Rename</Text>
          </Pressable>
        </View>
      )}

      <Text className="text-sm text-slate-500 mb-6">Balance · {formatINRCompact(pocket.balance)}</Text>

      <View className="flex-row gap-3 mb-8">
        <Pressable
          onPress={() => router.push({ pathname: '/reallocate', params: { from: pocket.id } })}
          className="flex-1 bg-slate-900 hover:bg-slate-800 rounded-full py-3 items-center"
        >
          <Text className="text-white font-semibold">Move money</Text>
        </Pressable>
        <Pressable
          onPress={() => setConfirmingDissolve(true)}
          className="flex-1 bg-white hover:bg-rose-50 border border-rose-300 rounded-full py-3 items-center"
        >
          <Text className="text-rose-700 font-semibold">Dissolve</Text>
        </Pressable>
      </View>

      <Text className="text-xs text-slate-500 uppercase tracking-wider mb-3">Transactions</Text>
      {ownedTransactions.length === 0 ? (
        <View className="bg-white border border-slate-200 rounded-xl p-6 items-center mb-10">
          <Text className="text-base text-slate-600 text-center">
            No transactions attributed to this pocket yet.
          </Text>
        </View>
      ) : (
        <View className="gap-2 mb-10">
          {ownedTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              pocket={pocket}
              showPocketLabel={false}
            />
          ))}
        </View>
      )}

      <Modal
        visible={confirmingDissolve}
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
              Dissolve {pocket.name}?
            </Text>
            <Text className="text-sm text-slate-600 mb-6">
              {formatINRCompact(pocket.balance)} will return to Free Cash. This cannot be undone.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setConfirmingDissolve(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 rounded-full py-3 items-center"
              >
                <Text className="text-slate-900 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDissolve}
                className="flex-1 bg-rose-600 hover:bg-rose-700 rounded-full py-3 items-center"
              >
                <Text className="text-white font-semibold">Dissolve</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
