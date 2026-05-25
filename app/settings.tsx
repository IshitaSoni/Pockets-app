import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { usePocketsStore } from '../store/store';
import {
  formatINRCompact,
  paise,
  paiseToRupees,
  rupeesToPaise,
} from '../utils/currency';
import { useEscapeToClose } from '../utils/useEscapeToClose';

export default function Settings() {
  const totalBalance = usePocketsStore((s) => s.totalBalance);
  const setTotalBalance = usePocketsStore((s) => s.setTotalBalance);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEscapeToClose(!confirmReset);

  const startEdit = () => {
    setDraft(paiseToRupees(totalBalance).toString());
    setEditing(true);
    setError(null);
  };

  const saveEdit = () => {
    const num = parseFloat(draft);
    if (!Number.isFinite(num) || num < 0) {
      setError('Enter a valid amount');
      return;
    }
    setTotalBalance(rupeesToPaise(num));
    setEditing(false);
  };

  const doReset = () => {
    usePocketsStore.setState({
      totalBalance: paise(0),
      pockets: [],
      transactions: [],
      pendingAttribution: null,
      pendingSpend: null,
    });
    setConfirmReset(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-slate-50 px-6 pt-6">
        <Stack.Screen options={{ title: 'Settings' }} />

      <Text className="text-xs text-slate-500 uppercase tracking-wider mb-2">
        Bank Balance
      </Text>
      {editing ? (
        <View className="mb-8">
          <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-4 py-3 mb-2">
            <Text className="text-2xl text-slate-500 mr-2">₹</Text>
            <TextInput
              className="flex-1 text-2xl font-semibold text-slate-900"
              value={draft}
              onChangeText={(t) => {
                setDraft(t);
                setError(null);
              }}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          {error && <Text className="text-sm text-rose-600 mb-2">{error}</Text>}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setEditing(false)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 rounded-full py-3 items-center"
            >
              <Text className="text-slate-900 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={saveEdit}
              className="flex-1 bg-slate-900 hover:bg-slate-800 rounded-full py-3 items-center"
            >
              <Text className="text-white font-semibold">Save</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="bg-white border border-slate-200 rounded-xl px-4 py-4 flex-row justify-between items-center mb-8">
          <Text className="text-base font-semibold text-slate-900">
            {formatINRCompact(totalBalance)}
          </Text>
          <Pressable onPress={startEdit}>
            <Text className="text-sm text-slate-500 underline">Edit</Text>
          </Pressable>
        </View>
      )}

      {__DEV__ && (
        <View className="mt-4">
          <Text className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Dev only
          </Text>
          <Pressable
            onPress={() => setConfirmReset(true)}
            className="bg-white hover:bg-rose-50 border border-rose-300 rounded-full py-3 items-center"
          >
            <Text className="text-rose-700 font-semibold">Reset all data</Text>
          </Pressable>
          <Text className="text-xs text-slate-500 mt-2">
            Wipes all pockets, transactions, and balance. Only visible in dev builds.
          </Text>
        </View>
      )}

      <Modal
        visible={confirmReset}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmReset(false)}
      >
        <Pressable
          onPress={() => setConfirmReset(false)}
          className="flex-1 bg-black/50 justify-center items-center px-6"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
          >
            <Text className="text-lg font-bold text-slate-900 mb-2">Reset all data?</Text>
            <Text className="text-sm text-slate-600 mb-6">
              All pockets, transactions, and balance will be wiped. This cannot be undone.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setConfirmReset(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 rounded-full py-3 items-center"
              >
                <Text className="text-slate-900 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={doReset}
                className="flex-1 bg-rose-600 hover:bg-rose-700 rounded-full py-3 items-center"
              >
                <Text className="text-white font-semibold">Reset</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
