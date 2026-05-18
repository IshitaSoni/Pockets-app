import { Text, View } from 'react-native';
import type { Paise, Pocket, Transaction } from '../domain/types';
import { formatINRCompact } from '../utils/currency';
import { formatRelativeTime } from '../utils/time';

type Props = {
  transaction: Transaction;
  pocket: Pocket | null;
  showPocketLabel?: boolean;
};

export function TransactionRow({ transaction, pocket, showPocketLabel = true }: Props) {
  const isOutflow = transaction.amount < 0;
  const absAmount = Math.abs(transaction.amount) as Paise;
  const sign = isOutflow ? '−' : '+';
  const pocketLabel = pocket ? pocket.name : 'Free Cash';

  return (
    <View className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex-row justify-between items-center">
      <View className="flex-1 mr-3">
        <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
          {transaction.description || 'Untitled'}
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5">
          {showPocketLabel ? `${pocketLabel} · ` : ''}
          {formatRelativeTime(transaction.timestamp)}
        </Text>
      </View>
      <Text
        className={`text-base font-semibold ${
          isOutflow ? 'text-slate-900' : 'text-emerald-700'
        }`}
      >
        {sign}
        {formatINRCompact(absAmount)}
      </Text>
    </View>
  );
}
