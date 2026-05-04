import { paise, rupeesToPaise, paiseToRupees, formatINR } from './currency';

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
