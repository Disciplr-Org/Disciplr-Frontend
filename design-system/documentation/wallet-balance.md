# Wallet Balance

## Overview

`WalletContext` exposes `balance`, `balanceStatus`, and `balanceError` derived
from a live Horizon account query. Components read these values through
`useWallet()` to surface balance-related UI.

**For a complete guide covering the connection flow, state machine, network handling, and Horizon integration, see [docs/WALLET_INTEGRATION.md](../../docs/WALLET_INTEGRATION.md).**

## balanceStatus values

| Value | Meaning |
|---|---|
| `idle` | Wallet not connected; no query issued. |
| `loading` | Balance fetch in progress. |
| `success` | USDC trustline found; `balance` holds the current amount. |
| `no_trustline` | Account exists but has no USDC trustline. |
| `error` | Horizon request failed; `balanceError` contains the message. |

## Horizon balance error contract

Balance fetching lives in
[`src/utils/horizon.ts`](../../src/utils/horizon.ts). `fetchUsdcBalance()`
throws a typed `HorizonBalanceError` whose `code` is one of three values
(`HorizonBalanceErrorCode`). The companion Horizon response contract is
documented in
[`documentation/horizon-balance.md`](../../documentation/horizon-balance.md).

### Error codes

| Code | When it is thrown (in `fetchUsdcBalance`) | Resulting `balanceStatus` | Suggested handling |
|---|---|---|---|
| `ACCOUNT_NOT_FOUND` | Horizon returns HTTP `404` for the account lookup. The account is not yet funded/created on the network. | `error` | Surface a message: the account does not exist on this network. Do **not** auto-retry; the account must be funded first. |
| `REQUEST_FAILED` | Any non-`404`, non-OK HTTP response (`!response.ok`), **or** the request is aborted/times out (`AbortError`; default `timeoutMs` is `10000`). | `error` | Transient. Safe to retry with backoff (e.g. a manual "Retry" control). Surface a message only after retries fail. |
| `INVALID_RESPONSE` | The response is OK but malformed: `balances` is not an array; **or** `balances` has more than `MAX_HORIZON_BALANCES` (100) entries; **or** the matched USDC trustline `balance` is not a finite numeric string. | `error` | Not retryable (the payload shape is wrong). Surface a generic balance-unavailable message and log for investigation. |

> Note: a missing USDC trustline is **not** an error. When the account exists
> but has no matching USDC trustline, `fetchUsdcBalance` resolves successfully
> with `{ balance: '0.00', hasTrustline: false }` — see the `no_trustline`
> mapping below.

### Code -> status mapping

`WalletContext.fetchNetworkAndBalance` translates the helper result/throw into
`balanceStatus` and `balanceError`:

| Outcome from `fetchUsdcBalance` | `balanceStatus` | `balanceError` | `balance` |
|---|---|---|---|
| Resolves, `hasTrustline === true` | `success` | `null` | the USDC amount |
| Resolves, `hasTrustline === false` | `no_trustline` | `null` | `'0.00'` |
| Throws `HorizonBalanceError` (`ACCOUNT_NOT_FOUND` / `REQUEST_FAILED` / `INVALID_RESPONSE`) | `error` | the error `message` | `null` |
| Throws `AbortError` (request superseded by a newer fetch / disconnect) | unchanged (early return) | unchanged | unchanged |

Key points:

- All three `HorizonBalanceError` codes collapse to a single `error` status.
  The distinction between codes is preserved only in the `balanceError`
  message string, not in `balanceStatus`.
- `no_trustline` is a **successful** fetch, not an error. It means "account is
  fine, just has no USDC trustline yet."
- `AbortError` is swallowed (the function returns early without touching state)
  because a newer fetch or a disconnect intentionally cancelled the in-flight
  request. A Horizon timeout, by contrast, is re-thrown by the helper as
  `REQUEST_FAILED`, not surfaced as `AbortError`.

### Connect -> fetch -> display flow

1. User triggers `connect()` (or `checkConnection()` runs on mount).
2. Freighter access is requested; on success the wallet address is read via
   `getAddress()` and stored.
3. `fetchNetworkAndBalance(address)` aborts any in-flight request, sets
   `balanceStatus = 'loading'`, and clears `balanceError`.
4. The active network is resolved via `getNetworkDetails()` and normalized to
   `TESTNET` / `PUBLIC`.
5. `fetchUsdcBalance(address, network, ...)` queries
   `GET {horizonUrl}/accounts/{address}` with a 10s timeout.
6. On resolve: `balance` is set and `balanceStatus` becomes `success`
   (trustline found) or `no_trustline` (no trustline).
7. On `HorizonBalanceError`: `balance` is cleared, `balanceStatus = 'error'`,
   and `balanceError` holds the message.
8. Components reading `useWallet()` render off `balanceStatus`/`balance`
   (e.g. `TrustlineBanner` for `no_trustline`, a balance-unavailable state for
   `error`).

```
connect()/checkConnection()
        |
        v
  getAddress()  ----> address
        |
        v
fetchNetworkAndBalance()  --> balanceStatus = 'loading'
        |
        v
getNetworkDetails() --> network
        |
        v
fetchUsdcBalance() --GET /accounts/{address}--> Horizon
        |
   +----+----------------------------+
   |                                 |
 resolve                          throw HorizonBalanceError
   |                                 |
   v                                 v
hasTrustline ? success           balanceStatus = 'error'
             : no_trustline      balanceError  = message
```

### Recommended consumer pattern

When reacting to balance state in a component:

- `success` — render the balance normally.
- `no_trustline` — **not an error.** Show guidance to add the USDC trustline
  (this is what `TrustlineBanner` does). Do not show a failure/retry UI.
- `loading` — show a spinner/placeholder.
- `error` — branch on intent using `balanceError`/the underlying code:
  - **Retry** when the cause is transient: `REQUEST_FAILED` (network blip,
    Horizon 5xx, or timeout). Offer a manual retry or retry with backoff.
  - **Surface a clear message, do not retry** when the cause is terminal:
    `ACCOUNT_NOT_FOUND` (account not funded on this network) and
    `INVALID_RESPONSE` (malformed payload — log it).

The crisp rule for `no_trustline` vs `error`: `no_trustline` means the fetch
**succeeded** and the account simply lacks a USDC trustline (offer to add one);
`error` means the fetch **failed** and no reliable balance is available (retry
or surface a message depending on the code above).
## WalletBalanceChip — header balance display

`src/components/Wallet/WalletBalanceChip.tsx` renders a compact chip in the
Layout header that shows the live USDC balance at a glance. It consumes
`useWallet()` and maps `balanceStatus` to appropriate views.

### States

| `balanceStatus` / condition | Render |
|---|---|
| `address` is `null` | Nothing |
| `idle` | Nothing |
| `loading` | `Skeleton` shimmer (80×18 px) |
| `success` | Formatted balance value + "USDC" |
| `no_trustline` | `0.00 USDC` (dimmed, with title attribute) |
| `error` | `! USDC` (danger color, `role="status"`) |

### Mounting

The chip mounts automatically via `Layout.tsx` next to `WalletConnectButton`:

```tsx
// Layout.tsx (already wired)
import { WalletBalanceChip } from './Wallet/WalletBalanceChip';
// ...
<WalletBalanceChip />
<WalletConnectButton />
```

### Styling

- Uses `wallet-balance-chip.css` scoped to the component.
- Pill shape via `var(--radius-full)`, background `var(--surface-raised)`.
- Error state uses `var(--danger)`, no-trustline uses `var(--muted)`.
- Loading state reuses the existing `Skeleton` component with `data-testid="skeleton"`.

## TrustlineBanner


`src/components/TrustlineBanner.tsx` renders a dismissible warning banner when
`balanceStatus === 'no_trustline'` and the wallet is connected. It displays the
network-specific USDC issuer address from `USDC_ISSUERS[network]` in
`src/utils/horizon.ts` so the user knows exactly which asset to trust.

- Uses `var(--warning)` and `var(--surface)` design tokens - no hardcoded colors.
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

- Warning is soft: the submit button is not disabled by an insufficient balance.
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

## Fetch behavior

- `TESTNET` accounts query `https://horizon-testnet.stellar.org`.
- `PUBLIC` accounts query `https://horizon.stellar.org`.
- The balance helper only accepts the configured Circle USDC issuer for the active network.
- The matched USDC trustline balance must also be a finite numeric string; malformed or missing balance values are treated as an invalid Horizon response.
- Accounts without that USDC trustline show `0.00 USDC` with a no-trustline note.
- Horizon request failures and missing accounts show a balance-unavailable state instead of a stale or mocked value.
- The dropdown renders a loading state while the Horizon request is in flight.
