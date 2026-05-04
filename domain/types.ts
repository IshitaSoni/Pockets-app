export type Paise = number & { readonly __brand: 'Paise' };

export type ID = string;

export type Pocket = {
  id: ID;
  name: string;
  balance: Paise;
};

export type Transaction = {
  id: ID;
  pocketId: ID | null;
  amount: Paise;
  description?: string;
  timestamp: number;
};

export type PendingAttribution = {
  amount: Paise;
  timestamp: number;
  description?: string;
};

export type PendingSpend = {
  amount: Paise;
  pocketId: ID;
  description?: string;
};

export type AppState = {
  totalBalance: Paise;
  pockets: Pocket[];
  transactions: Transaction[];
};
