# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

Pockets is a standalone React Native webapp that digitizes mental accounting by overlaying flexible visual separators ("pockets") on top of a user's bank account balance. Users carve their balance into named pockets (Rent, Groceries, Travel, etc.) without the bank actually moving any money.

## Core Domain Logic

The accounting model is intentionally simple and must be preserved end-to-end:

```
Total Balance = Free Cash + Σ(Pocket Balances)
```

- **Total Balance** is the user's real bank balance (source of truth).
- **Pockets** are user-defined allocations; each has a name and an allocated amount.
- **Free Cash** is the residual: `Total Balance − Σ(Pocket Balances)`. It is a derived value, never stored independently.

### Rebudgeting Rule (overspend handling)

When a spend is recorded against a pocket and the spend exceeds that pocket's allocated balance:

1. The transaction is **not** silently absorbed by Free Cash or another pocket.
2. The app must surface the deficit and require the user to **manually allocate** the shortfall from either Free Cash or another pocket of their choice.
3. Only after the user resolves the allocation does the spend post and balances update.

This rule is the heart of the product — never auto-balance, never let a pocket go negative without an explicit user choice.

## Tech Stack

- **React Native + Expo** (managed workflow)
- **TypeScript** — strict mode; no `any` in domain code (pockets, transactions, balances).
- **Zustand** — single source of truth for app state. Selectors over deep prop drilling.
- **NativeWind (Tailwind for RN)** — styling via `className` props; no inline `StyleSheet` for new components unless platform-specific quirks demand it.
- **State persistence** — Zustand `persist` middleware backed by AsyncStorage (or `expo-secure-store` for sensitive fields).

## Code Style

- **Functional components only.** No class components. Hooks for all stateful/effectful logic.
- **Indian Rupee formatting** is a first-class concern. All money displayed to the user must use `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` (or the equivalent helper in `utils/currency.ts`). This includes the lakh/crore grouping (`1,00,000`, not `100,000`). Never hardcode `₹` with raw numbers.
- **Money is stored in paise (integers).** Avoid floating-point for balances; convert at the display layer only. This prevents rounding drift across allocations.
- **Clean state persistence:** the persisted slice should contain only durable user data (pockets, transactions, total balance). Derived values (Free Cash, totals) are computed in selectors, never persisted. Migrations must be versioned via Zustand `persist`'s `version` + `migrate`.
- **Domain mutations go through the store**, not through ad-hoc setters in components. Components dispatch intents (`addPocket`, `recordSpend`, `reallocate`); the store enforces invariants (e.g., the rebudgeting rule).

## Invariants to enforce in the store

1. `Σ(pocket.allocated) ≤ totalBalance` at all times. Free Cash is `totalBalance − Σ(pocket.allocated)` and must be `≥ 0`.
2. A pocket's `balance` after a spend must be `≥ 0`, unless the user has just confirmed a reallocation from another source.
3. Every transaction is attributed to exactly one pocket (or to Free Cash). No orphan transactions.
