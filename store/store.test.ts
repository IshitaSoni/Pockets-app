import { freeCash } from '../domain/match';
import { paise } from '../utils/currency';
import { usePocketsStore } from './store';

const store = () => usePocketsStore.getState();

const reset = () => {
  usePocketsStore.setState({
    totalBalance: paise(0),
    pockets: [],
    transactions: [],
    pendingAttribution: null,
    pendingSpend: null,
  });
};

const seedWorkedExample = () => {
  store().setTotalBalance(paise(1000000)); // ₹10,000
  store().addPocket('Birthday', paise(500000)); // ₹5,000
  store().addPocket('Dress', paise(200000)); // ₹2,000
  // Free Cash = ₹3,000
};

const pocketByName = (name: string) => store().pockets.find((p) => p.name === name)!;

beforeEach(reset);

describe('initial state', () => {
  it('starts at zero with empty collections', () => {
    const s = store();
    expect(s.totalBalance).toBe(0);
    expect(s.pockets).toEqual([]);
    expect(s.transactions).toEqual([]);
    expect(s.pendingAttribution).toBeNull();
    expect(s.pendingSpend).toBeNull();
  });
});

describe('setTotalBalance', () => {
  it('sets the balance directly', () => {
    store().setTotalBalance(paise(1000000));
    expect(store().totalBalance).toBe(1000000);
    expect(freeCash(store())).toBe(1000000);
  });
});

describe('addPocket', () => {
  beforeEach(() => store().setTotalBalance(paise(1000000)));

  it('creates a pocket within free cash', () => {
    store().addPocket('Travel', paise(300000));
    expect(store().pockets).toHaveLength(1);
    expect(pocketByName('Travel').balance).toBe(300000);
    expect(freeCash(store())).toBe(700000);
  });

  it('rejects pocket balance exceeding free cash', () => {
    expect(() => store().addPocket('Big', paise(2000000))).toThrow();
    expect(store().pockets).toEqual([]);
  });

  it('rejects zero or negative balance', () => {
    expect(() => store().addPocket('Zero', paise(0))).toThrow();
    expect(() => store().addPocket('Neg', paise(-100))).toThrow();
  });
});

describe('removePocket', () => {
  it('removes the pocket and returns its balance to free cash', () => {
    seedWorkedExample();
    const dress = pocketByName('Dress');
    store().removePocket(dress.id);
    expect(store().pockets).toHaveLength(1);
    expect(freeCash(store())).toBe(500000); // ₹3,000 + ₹2,000 reclaimed
  });
});

describe('renamePocket', () => {
  it('updates the name', () => {
    seedWorkedExample();
    const dress = pocketByName('Dress');
    store().renamePocket(dress.id, 'Wardrobe');
    expect(pocketByName('Wardrobe').balance).toBe(200000);
  });
});

describe('deposit', () => {
  beforeEach(() => store().setTotalBalance(paise(1000000)));

  it('to free cash: total and free cash both grow', () => {
    store().deposit(paise(500000), null, 'salary');
    expect(store().totalBalance).toBe(1500000);
    expect(freeCash(store())).toBe(1500000);
    expect(store().transactions).toHaveLength(1);
    expect(store().transactions[0]!.amount).toBe(500000);
    expect(store().transactions[0]!.pocketId).toBeNull();
  });

  it('to a pocket: total and pocket grow, free cash unchanged', () => {
    store().addPocket('Travel', paise(200000));
    const travel = pocketByName('Travel');
    store().deposit(paise(100000), travel.id);
    expect(store().totalBalance).toBe(1100000);
    expect(pocketByName('Travel').balance).toBe(300000);
    expect(freeCash(store())).toBe(800000);
  });
});

describe('reallocate', () => {
  beforeEach(() => {
    store().setTotalBalance(paise(1000000));
    store().addPocket('A', paise(300000));
    store().addPocket('B', paise(200000));
  });

  it('moves money from free cash to a pocket', () => {
    const a = pocketByName('A');
    store().reallocate(paise(100000), null, a.id);
    expect(pocketByName('A').balance).toBe(400000);
    expect(freeCash(store())).toBe(400000);
  });

  it('moves money from a pocket to free cash', () => {
    const a = pocketByName('A');
    store().reallocate(paise(100000), a.id, null);
    expect(pocketByName('A').balance).toBe(200000);
    expect(freeCash(store())).toBe(600000);
  });

  it('moves money pocket-to-pocket without touching free cash', () => {
    const a = pocketByName('A');
    const b = pocketByName('B');
    store().reallocate(paise(100000), a.id, b.id);
    expect(pocketByName('A').balance).toBe(200000);
    expect(pocketByName('B').balance).toBe(300000);
    expect(freeCash(store())).toBe(500000);
  });

  it('rejects when source has insufficient balance', () => {
    const a = pocketByName('A');
    expect(() => store().reallocate(paise(1000000), a.id, null)).toThrow();
  });

  it('rejects when source equals target', () => {
    const a = pocketByName('A');
    expect(() => store().reallocate(paise(100), a.id, a.id)).toThrow();
  });
});

describe('recordIncomingDebit', () => {
  beforeEach(seedWorkedExample);

  it('silently posts to free cash when no pocket matches the heuristic', () => {
    store().recordIncomingDebit(paise(5000), 'coffee'); // ₹50, no match
    expect(store().pendingAttribution).toBeNull();
    expect(store().transactions).toHaveLength(1);
    expect(store().transactions[0]!.amount).toBe(-5000);
    expect(store().transactions[0]!.pocketId).toBeNull();
    expect(store().totalBalance).toBe(995000);
    expect(freeCash(store())).toBe(295000);
  });

  it('sets pendingAttribution when a pocket matches; no transaction yet', () => {
    store().recordIncomingDebit(paise(180000), 'dress shop'); // ₹1,800 matches Dress (90%)
    expect(store().pendingAttribution).not.toBeNull();
    expect(store().pendingAttribution!.amount).toBe(180000);
    expect(store().transactions).toHaveLength(0);
    // totalBalance dropped immediately (bank already debited)
    expect(store().totalBalance).toBe(820000);
  });

  it('drives free cash negative when amount exceeds free cash and no pocket matches', () => {
    store().recordIncomingDebit(paise(400000), 'ATM'); // ₹4,000, matches Birthday actually
    // Adjust: pick an amount that doesn't match either pocket (must be outside 80-110% of all)
    reset();
    seedWorkedExample();
    store().recordIncomingDebit(paise(350000), 'ATM'); // ₹3,500
    // 3500/5000=0.7 (out, since min is 0.8); 3500/2000=1.75 (out). No match.
    expect(store().pendingAttribution).toBeNull();
    expect(store().totalBalance).toBe(650000);
    expect(freeCash(store())).toBe(-50000); // ₹-500 — overdrawn
  });
});

describe('attributePending', () => {
  it('to free cash: records a transaction; balances unchanged from post-debit state', () => {
    seedWorkedExample();
    store().recordIncomingDebit(paise(180000));
    const before = store().totalBalance;
    store().attributePending(null);
    expect(store().pendingAttribution).toBeNull();
    expect(store().transactions).toHaveLength(1);
    expect(store().transactions[0]!.pocketId).toBeNull();
    expect(store().totalBalance).toBe(before);
    expect(pocketByName('Dress').balance).toBe(200000);
  });

  it('to a pocket with sufficient balance: pocket debited, transaction recorded', () => {
    seedWorkedExample();
    store().recordIncomingDebit(paise(180000)); // matches Dress
    const dress = pocketByName('Dress');
    store().attributePending(dress.id);
    expect(store().pendingAttribution).toBeNull();
    expect(store().pendingSpend).toBeNull();
    expect(pocketByName('Dress').balance).toBe(20000);
    expect(store().transactions).toHaveLength(1);
    expect(store().transactions[0]!.pocketId).toBe(dress.id);
    expect(freeCash(store())).toBe(300000); // restored to original
  });

  it('to a pocket with insufficient balance: enters pendingSpend, no posting', () => {
    seedWorkedExample();
    store().recordIncomingDebit(paise(400000), 'ATM'); // matches Birthday (4000/5000=0.8)
    const dress = pocketByName('Dress');
    store().attributePending(dress.id); // Dress only has ₹2,000 < ₹4,000
    expect(store().pendingAttribution).toBeNull();
    expect(store().pendingSpend).not.toBeNull();
    expect(store().pendingSpend!.pocketId).toBe(dress.id);
    expect(store().pendingSpend!.amount).toBe(400000);
    expect(store().transactions).toHaveLength(0);
    expect(pocketByName('Dress').balance).toBe(200000);
  });
});

describe('dismissPendingAttribution', () => {
  it('falls through to free cash like attributePending(null)', () => {
    seedWorkedExample();
    store().recordIncomingDebit(paise(180000));
    store().dismissPendingAttribution();
    expect(store().pendingAttribution).toBeNull();
    expect(store().transactions).toHaveLength(1);
    expect(store().transactions[0]!.pocketId).toBeNull();
  });

  // The ATM-withdrawal scenario: heuristic matches a pocket but the user dismisses
  // the suggestion. Spend lands in Free Cash; pockets untouched; FC may go negative.
  it('drives free cash negative when user rejects a matching suggestion (ATM withdrawal)', () => {
    seedWorkedExample();
    store().recordIncomingDebit(paise(400000)); // ₹4,000 matches Birthday (80%)
    expect(store().pendingAttribution).not.toBeNull();
    store().dismissPendingAttribution();
    expect(store().totalBalance).toBe(600000);
    expect(pocketByName('Birthday').balance).toBe(500000);
    expect(pocketByName('Dress').balance).toBe(200000);
    expect(freeCash(store())).toBe(-100000); // -₹1,000, banner-worthy
  });
});

describe('resolvePendingSpend', () => {
  // Reproduces the worked example end-to-end:
  // Total ₹10,000; Birthday ₹5,000; Dress ₹2,000; FC ₹3,000.
  // User debits ₹4,000, attributes to Dress (insufficient), rebudgets from FC.
  // Final: Total ₹6,000; Birthday ₹5,000; Dress ₹0; FC ₹1,000.
  it('with free cash source: covers deficit and posts atomically (worked example)', () => {
    seedWorkedExample();
    store().recordIncomingDebit(paise(400000)); // matches Birthday
    const dress = pocketByName('Dress');
    store().attributePending(dress.id); // insufficient, pendingSpend set
    store().resolvePendingSpend(null); // user picks Free Cash
    expect(store().pendingSpend).toBeNull();
    expect(store().totalBalance).toBe(600000);
    expect(pocketByName('Birthday').balance).toBe(500000);
    expect(pocketByName('Dress').balance).toBe(0);
    expect(freeCash(store())).toBe(100000); // ₹1,000 — recovered as expected
    expect(store().transactions).toHaveLength(1);
    expect(store().transactions[0]!.pocketId).toBe(dress.id);
    expect(store().transactions[0]!.amount).toBe(-400000);
  });

  it('with another pocket as source: deficit pulled from that pocket', () => {
    store().setTotalBalance(paise(1000000));
    store().addPocket('A', paise(200000));
    store().addPocket('B', paise(300000));
    // FC = ₹5,000
    store().recordIncomingDebit(paise(250000)); // matches B (250/300=0.83)
    const a = pocketByName('A');
    const b = pocketByName('B');
    store().attributePending(a.id); // A=2000 insufficient → pendingSpend
    store().resolvePendingSpend(b.id); // pull deficit ₹500 from B
    expect(store().pendingSpend).toBeNull();
    expect(pocketByName('A').balance).toBe(0);
    expect(pocketByName('B').balance).toBe(250000);
    expect(store().totalBalance).toBe(750000);
    expect(freeCash(store())).toBe(500000); // FC unchanged
  });

  it('rejects when source pocket is the same as the spend target', () => {
    seedWorkedExample();
    store().recordIncomingDebit(paise(400000));
    const dress = pocketByName('Dress');
    store().attributePending(dress.id);
    expect(() => store().resolvePendingSpend(dress.id)).toThrow();
  });

  it('rejects when source pocket has insufficient balance for the deficit', () => {
    store().setTotalBalance(paise(1000000));
    store().addPocket('A', paise(1000)); // ₹10
    store().addPocket('B', paise(40000)); // ₹400
    const aId = pocketByName('A').id;
    const bId = pocketByName('B').id;
    usePocketsStore.setState({
      pendingSpend: { amount: paise(180000), pocketId: aId },
    });
    expect(() => store().resolvePendingSpend(bId)).toThrow();
  });
});

describe('cancelPendingSpend', () => {
  it('falls through to free cash; pocket untouched', () => {
    seedWorkedExample();
    store().recordIncomingDebit(paise(400000));
    const dress = pocketByName('Dress');
    store().attributePending(dress.id);
    store().cancelPendingSpend();
    expect(store().pendingSpend).toBeNull();
    expect(store().transactions).toHaveLength(1);
    expect(store().transactions[0]!.pocketId).toBeNull();
    expect(pocketByName('Dress').balance).toBe(200000);
    // Total stays at the post-debit value; free cash absorbs (negative)
    expect(store().totalBalance).toBe(600000);
    expect(freeCash(store())).toBe(-100000);
  });
});

describe('invariants', () => {
  it('Σ(pocket.balance) + freeCash equals totalBalance after every flow', () => {
    seedWorkedExample();
    const checkSum = () => {
      const s = store();
      const sum = s.pockets.reduce((a, p) => a + p.balance, 0);
      expect(sum + freeCash(s)).toBe(s.totalBalance);
    };
    checkSum();
    store().recordIncomingDebit(paise(180000));
    checkSum();
    store().attributePending(pocketByName('Dress').id);
    checkSum();
    store().deposit(paise(50000), null);
    checkSum();
    store().reallocate(paise(20000), null, pocketByName('Birthday').id);
    checkSum();
  });

  it('pocket balance never goes negative through normal flows', () => {
    seedWorkedExample();
    store().recordIncomingDebit(paise(400000));
    store().attributePending(pocketByName('Dress').id);
    store().resolvePendingSpend(null);
    for (const p of store().pockets) {
      expect(p.balance).toBeGreaterThanOrEqual(0);
    }
  });
});
