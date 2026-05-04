import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { freeCash, suggestAttribution } from '../domain/match';
import type {
  AppState,
  ID,
  Paise,
  PendingAttribution,
  PendingSpend,
  Pocket,
  Transaction,
} from '../domain/types';
import { paise } from '../utils/currency';

type StoreState = AppState & {
  pendingAttribution: PendingAttribution | null;
  pendingSpend: PendingSpend | null;
};

type StoreActions = {
  setTotalBalance: (amount: Paise) => void;
  addPocket: (name: string, balance: Paise) => void;
  removePocket: (id: ID) => void;
  renamePocket: (id: ID, name: string) => void;
  deposit: (amount: Paise, target: ID | null, description?: string) => void;
  reallocate: (amount: Paise, from: ID | null, to: ID | null) => void;
  recordIncomingDebit: (amount: Paise, description?: string) => void;
  attributePending: (target: ID | null) => void;
  dismissPendingAttribution: () => void;
  resolvePendingSpend: (source: ID | null) => void;
  cancelPendingSpend: () => void;
};

export type Store = StoreState & StoreActions;

const initialState: StoreState = {
  totalBalance: paise(0),
  pockets: [],
  transactions: [],
  pendingAttribution: null,
  pendingSpend: null,
};

const newId = (): ID => {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const requirePositive = (amount: Paise, label = 'amount'): void => {
  if (amount <= 0) throw new Error(`${label} must be positive, got ${amount}`);
};

const updatePocket = (
  pockets: Pocket[],
  id: ID,
  fn: (p: Pocket) => Pocket
): Pocket[] => pockets.map((p) => (p.id === id ? fn(p) : p));

export const createPocketsStore = () =>
  create<Store>()(
    persist(
      (set, get) => ({
        ...initialState,

        setTotalBalance: (amount) => set({ totalBalance: amount }),

        addPocket: (name, balance) => {
          requirePositive(balance, 'pocket balance');
          const fc = freeCash(get());
          if (balance > fc) {
            throw new Error(
              `Cannot allocate ${balance} paise to pocket; only ${fc} paise free`
            );
          }
          const pocket: Pocket = { id: newId(), name, balance };
          set((s) => ({ pockets: [...s.pockets, pocket] }));
        },

        removePocket: (id) =>
          set((s) => ({ pockets: s.pockets.filter((p) => p.id !== id) })),

        renamePocket: (id, name) =>
          set((s) => ({
            pockets: updatePocket(s.pockets, id, (p) => ({ ...p, name })),
          })),

        deposit: (amount, target, description) => {
          requirePositive(amount, 'deposit amount');
          set((s) => {
            const tx: Transaction = {
              id: newId(),
              pocketId: target,
              amount,
              description,
              timestamp: Date.now(),
            };
            const pockets =
              target === null
                ? s.pockets
                : updatePocket(s.pockets, target, (p) => ({
                    ...p,
                    balance: paise(p.balance + amount),
                  }));
            return {
              totalBalance: paise(s.totalBalance + amount),
              pockets,
              transactions: [...s.transactions, tx],
            };
          });
        },

        reallocate: (amount, from, to) => {
          requirePositive(amount, 'reallocation amount');
          if (from === to) throw new Error('Reallocation source and target must differ');
          set((s) => {
            const sourceBal =
              from === null
                ? freeCash(s)
                : (s.pockets.find((p) => p.id === from)?.balance ?? paise(0));
            if (sourceBal < amount) {
              throw new Error('Reallocation source has insufficient balance');
            }
            let pockets = s.pockets;
            if (from !== null) {
              pockets = updatePocket(pockets, from, (p) => ({
                ...p,
                balance: paise(p.balance - amount),
              }));
            }
            if (to !== null) {
              pockets = updatePocket(pockets, to, (p) => ({
                ...p,
                balance: paise(p.balance + amount),
              }));
            }
            return { pockets };
          });
        },

        recordIncomingDebit: (amount, description) => {
          requirePositive(amount, 'debit amount');
          set((s) => {
            const newTotal = paise(s.totalBalance - amount);
            const suggestion = suggestAttribution(amount, s.pockets);
            if (suggestion === null) {
              const tx: Transaction = {
                id: newId(),
                pocketId: null,
                amount: paise(-amount),
                description,
                timestamp: Date.now(),
              };
              return {
                totalBalance: newTotal,
                transactions: [...s.transactions, tx],
              };
            }
            return {
              totalBalance: newTotal,
              pendingAttribution: { amount, description, timestamp: Date.now() },
            };
          });
        },

        attributePending: (target) => {
          const pa = get().pendingAttribution;
          if (!pa) return;
          set((s) => {
            if (target === null) {
              const tx: Transaction = {
                id: newId(),
                pocketId: null,
                amount: paise(-pa.amount),
                description: pa.description,
                timestamp: pa.timestamp,
              };
              return {
                transactions: [...s.transactions, tx],
                pendingAttribution: null,
              };
            }
            const pocket = s.pockets.find((p) => p.id === target);
            if (!pocket) throw new Error(`Pocket ${target} not found`);
            if (pocket.balance >= pa.amount) {
              const pockets = updatePocket(s.pockets, target, (p) => ({
                ...p,
                balance: paise(p.balance - pa.amount),
              }));
              const tx: Transaction = {
                id: newId(),
                pocketId: target,
                amount: paise(-pa.amount),
                description: pa.description,
                timestamp: pa.timestamp,
              };
              return {
                pockets,
                transactions: [...s.transactions, tx],
                pendingAttribution: null,
              };
            }
            return {
              pendingAttribution: null,
              pendingSpend: {
                amount: pa.amount,
                pocketId: target,
                description: pa.description,
              },
            };
          });
        },

        dismissPendingAttribution: () => get().attributePending(null),

        resolvePendingSpend: (source) => {
          const ps = get().pendingSpend;
          if (!ps) return;
          if (source === ps.pocketId) {
            throw new Error('Rebudget source cannot be the same pocket as the spend');
          }
          set((s) => {
            const pocket = s.pockets.find((p) => p.id === ps.pocketId);
            if (!pocket) throw new Error(`Pocket ${ps.pocketId} not found`);
            const deficit = paise(ps.amount - pocket.balance);
            if (source !== null) {
              const sourcePocket = s.pockets.find((p) => p.id === source);
              if (!sourcePocket) throw new Error(`Source pocket ${source} not found`);
              if (sourcePocket.balance < deficit) {
                throw new Error('Source pocket has insufficient balance to cover deficit');
              }
            }
            let pockets = s.pockets;
            if (source !== null) {
              pockets = updatePocket(pockets, source, (p) => ({
                ...p,
                balance: paise(p.balance - deficit),
              }));
            }
            pockets = updatePocket(pockets, ps.pocketId, (p) => ({
              ...p,
              balance: paise(p.balance + deficit - ps.amount),
            }));
            const tx: Transaction = {
              id: newId(),
              pocketId: ps.pocketId,
              amount: paise(-ps.amount),
              description: ps.description,
              timestamp: Date.now(),
            };
            return {
              pockets,
              transactions: [...s.transactions, tx],
              pendingSpend: null,
            };
          });
        },

        cancelPendingSpend: () => {
          const ps = get().pendingSpend;
          if (!ps) return;
          set((s) => {
            const tx: Transaction = {
              id: newId(),
              pocketId: null,
              amount: paise(-ps.amount),
              description: ps.description,
              timestamp: Date.now(),
            };
            return {
              transactions: [...s.transactions, tx],
              pendingSpend: null,
            };
          });
        },
      }),
      {
        name: 'pockets-store',
        storage: createJSONStorage(() => AsyncStorage),
        version: 1,
        migrate: (persistedState) => persistedState,
        partialize: (state) => ({
          totalBalance: state.totalBalance,
          pockets: state.pockets,
          transactions: state.transactions,
          pendingAttribution: state.pendingAttribution,
        }),
      }
    )
  );

export const usePocketsStore = createPocketsStore();
