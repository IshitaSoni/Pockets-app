import type { AppState, ID, Paise, Pocket } from './types';

export const MATCH_MIN_RATIO = 0.8;
export const MATCH_MAX_RATIO = 1.1;

export type AttributionSuggestion =
  | { kind: 'single'; pocketId: ID }
  | { kind: 'multi'; pocketIds: ID[] }
  | null;

export function suggestAttribution(
  amount: Paise,
  pockets: readonly Pocket[]
): AttributionSuggestion {
  if (amount <= 0) return null;
  const matches = pockets.filter((p) => {
    if (p.balance <= 0) return false;
    const ratio = amount / p.balance;
    return ratio >= MATCH_MIN_RATIO && ratio <= MATCH_MAX_RATIO;
  });
  if (matches.length === 0) return null;
  if (matches.length === 1) return { kind: 'single', pocketId: matches[0].id };
  return { kind: 'multi', pocketIds: matches.map((p) => p.id) };
}

export function freeCash(state: Pick<AppState, 'totalBalance' | 'pockets'>): Paise {
  const allocated = state.pockets.reduce((sum, p) => sum + p.balance, 0);
  return (state.totalBalance - allocated) as Paise;
}
