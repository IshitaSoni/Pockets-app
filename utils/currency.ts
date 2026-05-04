import type { Paise } from '../domain/types';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

export function paise(amount: number): Paise {
  if (!Number.isInteger(amount)) {
    throw new Error(`Paise must be an integer, got ${amount}`);
  }
  return amount as Paise;
}

export function rupeesToPaise(rupees: number): Paise {
  return paise(Math.round(rupees * 100));
}

export function paiseToRupees(amount: Paise): number {
  return amount / 100;
}

export function formatINR(amount: Paise): string {
  return inrFormatter.format(paiseToRupees(amount));
}
