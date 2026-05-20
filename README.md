# Pockets

A mental-accounting overlay on top of your real bank balance. Carve a single number into named buckets without the bank actually moving any money.

## The model

```
Total Balance = Free Cash + Σ(Pocket Balances)
```

- **Total Balance** — your actual bank balance (source of truth).
- **Pockets** — user-defined allocations with a name and a balance.
- **Free Cash** — derived as `Total Balance − Σ(Pockets)`. Can be negative when you've overdrawn (e.g., ATM withdrawal exceeds Free Cash). A rose banner appears prompting the user to reallocate from a pocket.

## Two deficit rules (asymmetric, on purpose)

| Scenario | App behavior |
|---|---|
| **Pocket spend > pocket balance** | Rebudget modal blocks the spend. User must explicitly pick a source — Free Cash or another pocket. Spend posts atomically with the reallocation. |
| **Free Cash spend > Free Cash balance** | Posts immediately. Free Cash goes negative. Rose banner shows on the dashboard until the user manually reallocates. |

Pockets cannot go negative without an explicit user choice. Free Cash can — it's the catch-all for reality.

## Smart attribution heuristic

When a debit is recorded, each pocket is checked: `0.8 ≤ amount / pocket.balance ≤ 1.1`.

- **Exactly one match** → prompt: *"Was this for [pocket]?"*
- **Multiple matches** → choice prompt
- **No match** → silently post to Free Cash, no prompt

Keeps daily ₹50 coffees from pestering the user.

## Tech stack

- **Expo SDK 54** managed workflow (web, iOS, Android — only web tested so far).
- **TypeScript** strict.
- **NativeWind v4** (Tailwind for React Native).
- **Zustand** state + **AsyncStorage** persistence (`version: 1`, `migrate` stub, `partialize` excludes `pendingSpend`).
- **expo-router** file-based navigation. Stack with modal-presentation screens for each flow.
- **Jest + jest-expo**. 59 tests across 4 suites.

## Running

```bash
npm install
npm run web         # http://localhost:8081
npm start           # full dev server with QR for Expo Go
npm test            # 59 tests
npx tsc --noEmit    # type check
```

For phone testing, both devices need to be on the same Wi-Fi network OR use:
```bash
npx expo start --tunnel    # slower; works through any firewall
```

## Project layout

```
app/                  Routes (file-based via expo-router)
├── _layout.tsx       Root Stack + SafeAreaProvider
├── index.tsx         Dashboard (Free Cash header, pockets, banners, recent txns)
├── set-balance.tsx   Modal — set total bank balance
├── add-pocket.tsx    Modal — carve a new pocket from Free Cash
├── record-transaction.tsx  Modal — record a debit or credit
├── attribute.tsx     Modal — allocate a detected debit
├── rebudget.tsx      Modal — pick deficit source when pocket can't cover
├── reallocate.tsx    Modal — move money between buckets + dissolve pocket
├── pocket/[id].tsx   Pocket detail (rename, transactions, dissolve)
└── settings.tsx      Modal — edit bank balance + dev-only reset

components/
└── TransactionRow.tsx

domain/
├── types.ts          Paise, Pocket, Transaction, PendingAttribution, PendingSpend, AppState
├── match.ts          freeCash() + suggestAttribution heuristic
└── match.test.ts

store/
├── store.ts          Zustand + persist + all actions
└── store.test.ts     Invariants, worked example, every action path

utils/
├── currency.ts       paise(), rupeesToPaise, paiseToRupees, formatINR, formatINRCompact
├── currency.test.ts
├── time.ts           formatRelativeTime
└── time.test.ts

styles/
├── global.css        Tailwind directives (NativeWind input)
└── css.d.ts          *.css ambient declaration
```

## Money handling

- Stored as **paise (integers)**. The branded `Paise` type prevents accidental mixing with raw rupees.
- Display: `formatINRCompact` on the dashboard (hides `.00` for whole rupees), `formatINR` where precision matters.
- Indian lakh/crore grouping (`₹1,00,000` not `₹100,000`) via `Intl.NumberFormat('en-IN')`.

## V1 status

**Done:** domain types, Zustand store, 59 tests, dashboard, all CRUD modals, rebudget flow, attribution heuristic, persistence, pocket detail (rename, dissolve, transactions), reallocate, recent transactions, keyboard avoidance, settings with dev-only reset.

**Deferred to V2:**
- Bank API or SMS parsing for auto-detected transactions
- UPI scanner flow (tap pocket → QR → pay)
- Reallocation history / audit log (reallocations are silent state changes)
- Multi-source rebudget (V1 = single source)
- Real app icon + splash artwork
- Verified Expo Go run on a physical phone
- Bundle ID / store-distribution metadata

## Things future-you should know

- **Free Cash can be negative.** Deliberate relaxation of CLAUDE.md's `Free Cash ≥ 0` invariant. The bank already debited; we record reality, not aspiration.
- **`pendingAttribution` is persisted; `pendingSpend` is not.** Close the app mid-attribution and you'll come back to the same prompt. Close mid-rebudget and the partial state is discarded — re-enter via the banner.
- **Zustand v5 ESM uses `import.meta`,** which Metro's web bundler ships as a plain `<script>`, breaking the browser. Fixed by `resolver.unstable_enablePackageExports = false` in `metro.config.js`. Native is fine via the `react-native` export condition.
- **`babel-preset-expo` and `jest-expo` are pinned to `~54.x`** to match Expo SDK 54. `npx expo install` resolved them to major-55 originally; `expo doctor` flagged it.

## Commit log

Step-by-step commits make this safe to bisect. Most recent first:

- `Step 5.6` — Transaction history, pocket detail, settings, keyboard avoidance
- `Step 5.4b–c + 5.5` — Resolve pending state + move money between pockets
- `Step 5.4a` — Record Transaction modal (debit + credit entry)
- `Step 5.3` — Set Balance and Add Pocket modals + dashboard polish
- `Step 5.2` — Read-only dashboard
- `Step 5.1` — Migrate to expo-router for file-based navigation
- `Step 4` — Zustand store with rebudgeting rule and smart attribution
- `Step 3` — Domain types
- `Step 2` — Money utilities
- `Step 1` — Bootstrap Pockets app: toolchain, currency utilities, domain types
