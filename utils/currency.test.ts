import { paise, rupeesToPaise, paiseToRupees, formatINR, formatINRCompact } from './currency';

describe('paise()', () => {
  it('accepts integers including zero and negatives', () => {
    expect(paise(0)).toBe(0);
    expect(paise(100)).toBe(100);
    expect(paise(-50)).toBe(-50);
  });

  it('throws on non-integer input', () => {
    expect(() => paise(1.5)).toThrow();
    expect(() => paise(0.1)).toThrow();
    expect(() => paise(NaN)).toThrow();
    expect(() => paise(Infinity)).toThrow();
  });
});

describe('rupeesToPaise / paiseToRupees', () => {
  it('converts whole rupees', () => {
    expect(rupeesToPaise(1)).toBe(100);
    expect(paiseToRupees(paise(100))).toBe(1);
  });

  it('rounds fractional rupees to nearest paise', () => {
    expect(rupeesToPaise(1.01)).toBe(101);
    expect(rupeesToPaise(0.999)).toBe(100);
  });

  it('round-trips a typical amount without drift', () => {
    expect(paiseToRupees(rupeesToPaise(123456.78))).toBe(123456.78);
  });
});

describe('formatINR()', () => {
  it('formats zero', () => {
    expect(formatINR(paise(0))).toBe('₹0.00');
  });

  it('formats sub-rupee paise', () => {
    expect(formatINR(paise(1))).toBe('₹0.01');
    expect(formatINR(paise(99))).toBe('₹0.99');
  });

  it('uses Indian lakh grouping (1,00,000 not 100,000)', () => {
    expect(formatINR(paise(10_000_000))).toBe('₹1,00,000.00');
  });

  it('uses Indian crore grouping', () => {
    expect(formatINR(paise(10_000_000_000))).toBe('₹10,00,00,000.00');
  });

  it('formats negatives with leading minus', () => {
    expect(formatINR(paise(-50_000))).toBe('-₹500.00');
  });
});

describe('formatINRCompact()', () => {
  it('hides .00 when amount is a whole rupee', () => {
    expect(formatINRCompact(paise(0))).toBe('₹0');
    expect(formatINRCompact(paise(100))).toBe('₹1');
    expect(formatINRCompact(paise(500000))).toBe('₹5,000');
    expect(formatINRCompact(paise(10_000_000))).toBe('₹1,00,000');
  });

  it('keeps decimals when paise are non-zero', () => {
    expect(formatINRCompact(paise(1))).toBe('₹0.01');
    expect(formatINRCompact(paise(150))).toBe('₹1.50');
    expect(formatINRCompact(paise(499999))).toBe('₹4,999.99');
  });

  it('handles negatives at both whole and fractional', () => {
    expect(formatINRCompact(paise(-100000))).toBe('-₹1,000');
    expect(formatINRCompact(paise(-150))).toBe('-₹1.50');
  });
});
