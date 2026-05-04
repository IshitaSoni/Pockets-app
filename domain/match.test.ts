import { paise } from '../utils/currency';
import type { Pocket } from './types';
import { freeCash, suggestAttribution } from './match';

const pocket = (id: string, name: string, balance: number): Pocket => ({
  id,
  name,
  balance: paise(balance),
});

describe('suggestAttribution', () => {
  const dress = pocket('dress', 'Dress', 200000); // ₹2,000
  const birthday = pocket('birthday', 'Birthday', 500000); // ₹5,000
  const travel = pocket('travel', 'Travel', 100000); // ₹1,000

  it('returns null when amount is below all match windows (small daily spend)', () => {
    expect(suggestAttribution(paise(5000), [dress, birthday, travel])).toBeNull(); // ₹50
  });

  it('returns single match when one pocket falls inside the window', () => {
    const result = suggestAttribution(paise(180000), [dress, birthday, travel]); // ₹1,800
    expect(result).toEqual({ kind: 'single', pocketId: 'dress' });
  });

  it('returns multi-match when several pockets fall inside the window', () => {
    const a = pocket('a', 'A', 100000);
    const b = pocket('b', 'B', 110000);
    const result = suggestAttribution(paise(95000), [a, b]);
    expect(result).toEqual({ kind: 'multi', pocketIds: ['a', 'b'] });
  });

  it('skips pockets with zero or negative balance', () => {
    const empty = pocket('empty', 'Empty', 0);
    expect(suggestAttribution(paise(100), [empty])).toBeNull();
  });

  it('returns null for zero-amount or negative input', () => {
    expect(suggestAttribution(paise(0), [dress])).toBeNull();
    expect(suggestAttribution(paise(-100), [dress])).toBeNull();
  });

  it('matches at the lower edge of the window (80%)', () => {
    const p = pocket('p', 'P', 100000);
    const result = suggestAttribution(paise(80000), [p]);
    expect(result).toEqual({ kind: 'single', pocketId: 'p' });
  });

  it('matches at the upper edge of the window (110%)', () => {
    const p = pocket('p', 'P', 100000);
    const result = suggestAttribution(paise(110000), [p]);
    expect(result).toEqual({ kind: 'single', pocketId: 'p' });
  });

  it('rejects amounts just below 80% (out of window)', () => {
    const p = pocket('p', 'P', 100000);
    expect(suggestAttribution(paise(79000), [p])).toBeNull();
  });

  it('rejects amounts above 110% (out of window)', () => {
    const p = pocket('p', 'P', 100000);
    expect(suggestAttribution(paise(120000), [p])).toBeNull();
  });
});

describe('freeCash', () => {
  it('returns total when no pockets exist', () => {
    expect(freeCash({ totalBalance: paise(1000000), pockets: [] })).toBe(1000000);
  });

  it('subtracts pocket balances from total', () => {
    expect(
      freeCash({
        totalBalance: paise(1000000),
        pockets: [pocket('a', 'A', 300000), pocket('b', 'B', 200000)],
      })
    ).toBe(500000);
  });

  it('returns negative when pocket sum exceeds total (overdraft)', () => {
    expect(
      freeCash({
        totalBalance: paise(600000),
        pockets: [pocket('a', 'A', 500000), pocket('b', 'B', 200000)],
      })
    ).toBe(-100000);
  });
});
