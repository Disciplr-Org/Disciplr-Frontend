# Wallet Balance

## Overview

`WalletContext` exposes `balance`, `balanceStatus`, and `balanceError` derived
from a live Horizon account query. Components read these values through
`useWallet()` to surface balance-related UI.

## balanceStatus values

| Value | Meaning |
|---|---|
| `idle` | Wallet not connected; no query issued. |
| `loading` | Balance fetch in progress. |
| `success` | USDC trustline found; `balance` holds the current amount. |
| `no_trustline` | Account exists but has no USDC trustline. |
| `error` | Horizon request failed; `balanceError` contains the message. |

## TrustlineBanner

`src/components/TrustlineBanner.tsx` renders a dismissible warning banner when
`balanceStatus === 'no_trustline'` and the wallet is connected. It displays the
network-specific USDC issuer address from `USDC_ISSUERS[network]` in
`src/utils/horizon.ts` so the user knows exactly which asset to trust.

- Uses `var(--warning)` and `var(--surface)` design tokens — no hardcoded colors.
- Dismissible per session via local React state (re-appears on page reload).
- Mounted globally in `Layout.tsx` so every page benefits.

### Usage

The banner mounts automatically via `Layout`. No extra wiring is needed in
individual pages.

```tsx
// Layout.tsx (already wired)
import { TrustlineBanner } from './TrustlineBanner';
// ...
<TrustlineBanner />
```

## Balance-aware CreateVault

`src/pages/CreateVault.tsx` reads `balance` and `balanceStatus` from
`useWallet()` and shows a non-blocking inline warning when the entered amount
exceeds the available balance.

- Warning is soft: the submit button is **not** disabled by an insufficient
  balance.
- Only shown when `balanceStatus === 'success'` (known, positive balance).
- Powered by `exceedsBalance(amount, balance)` in
  `src/utils/vaultValidation.ts`.

### exceedsBalance helper

```ts
exceedsBalance(amount: string, balance: string | null): boolean
```

Returns `true` only when both values parse as finite numbers and `amount > balance`.
Returns `false` for `null` balance, unparseable strings, or equal values, making
it safe to call when the balance has not yet loaded.
