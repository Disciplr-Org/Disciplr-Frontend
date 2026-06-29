# Network Configuration — Horizon, Explorer & USDC Issuers

This document is the single source of truth for every network-specific constant
in Disciplr-Frontend. It covers:

- The two supported networks (`TESTNET` / `PUBLIC`) and how they map to Horizon
  and Stellar Expert URLs.
- USDC issuer addresses per network.
- The `WalletNetwork` type and normalization logic.
- The Testnet fallback behaviour used by the explorer utilities.
- A step-by-step checklist for adding or changing a network.

---

## 1. Supported Networks

The application recognises exactly **two** network identifiers, defined as the
union type `WalletNetwork` in
[`src/context/WalletContext.tsx`](../src/context/WalletContext.tsx):

```ts
export type WalletNetwork = 'TESTNET' | 'PUBLIC';
```

| Identifier | Human label | Intended use |
|---|---|---|
| `'TESTNET'` | Testnet | Development and QA. Uses Stellar test infrastructure and Freighter test accounts. |
| `'PUBLIC'` | Mainnet | Production. Real assets, real transactions. |

---

## 2. Horizon URLs

Defined in [`src/utils/horizon.ts`](../src/utils/horizon.ts):

```ts
export const HORIZON_URLS: Record<WalletNetwork, string> = {
    TESTNET: 'https://horizon-testnet.stellar.org',
    PUBLIC:  'https://horizon.stellar.org',
};
```

The helper `horizonUrl(network)` returns the URL for the given network and is
the canonical way to construct Horizon API endpoint strings:

```ts
import { horizonUrl } from '../utils/horizon';

const base = horizonUrl('TESTNET');
// → 'https://horizon-testnet.stellar.org'
```

`fetchUsdcBalance` internally calls `horizonUrl` to build the accounts endpoint:

```
GET {horizonUrl(network)}/accounts/{encodeURIComponent(address)}
```

> **Never hard-code a Horizon URL.** Always call `horizonUrl(network)` or read
> from `HORIZON_URLS` so that a future network addition only requires one change.

---

## 3. USDC Issuer Addresses

Defined in [`src/utils/horizon.ts`](../src/utils/horizon.ts):

```ts
export const USDC_ISSUERS: Record<WalletNetwork, string> = {
    TESTNET: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    PUBLIC:  'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
};
```

| Network | Issuer address |
|---|---|
| `TESTNET` | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| `PUBLIC` | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` |

The issuer address is used by `fetchUsdcBalance` to identify the USDC balance
line within a Horizon account response:

```ts
const usdcBalance = account.balances.find(
    (balanceLine) =>
        balanceLine.asset_type !== 'native' &&
        balanceLine.asset_code  === 'USDC'  &&
        balanceLine.asset_issuer === issuer,        // ← USDC_ISSUERS[network]
);
```

A trustline is considered present when `usdcBalance` is defined. When absent,
`hasTrustline` is `false` and `balance` defaults to `'0.00'`.

> **Verify issuer addresses** against the official Centre / Circle documentation
> when updating for mainnet deployments. An incorrect issuer simply produces
> zero balances (no trustline) rather than throwing, which can be hard to
> diagnose.

### `MAX_HORIZON_BALANCES`

```ts
export const MAX_HORIZON_BALANCES = 100;
```

If the Horizon response contains more than 100 balance lines the fetch is
rejected with an `INVALID_RESPONSE` error. This guard prevents excessive memory
use when processing accounts with very large asset portfolios.

---

## 4. Explorer Base URLs

Defined in [`src/utils/explorer.ts`](../src/utils/explorer.ts):

```ts
const EXPLORER_BASE  = 'https://stellar.expert/explorer';

const EXPLORER_BASES: Record<WalletNetwork, string> = {
    TESTNET: 'https://stellar.expert/explorer/testnet',
    PUBLIC:  'https://stellar.expert/explorer/public',
};
```

### Public API

| Function | Signature | Returns |
|---|---|---|
| `getExplorerTxUrl` | `(txHash, network)` | Stellar Expert URL for a transaction |
| `getExplorerAccountUrl` | `(address, network)` | Stellar Expert URL for an account (empty string when `address` is invalid) |
| `contractExplorerUrl` | `(address, network)` | Stellar Expert URL for a contract (empty string when `address` is invalid) |
| `networkLabel` | `(network)` | Human-readable label: `'Mainnet'` or `'Testnet'` |

### Testnet fallback behaviour

Both `getExplorerTxUrl` and `getExplorerAccountUrl` accept `network` typed as
`'TESTNET' | 'PUBLIC' | null`. The segment is chosen with:

```ts
const segment = network === 'PUBLIC' ? 'public' : 'testnet';
```

`contractExplorerUrl` uses the `EXPLORER_BASES` record with a nullish-coalescing
fallback:

```ts
const base =
    EXPLORER_BASES[(network as WalletNetwork)] ??
    EXPLORER_BASES.TESTNET;
```

**Consequence:** any network value that is `null`, `undefined`, or an
unrecognised string silently defaults to the Testnet explorer. This is
intentional — it keeps the UI renderable during wallet initialisation before a
network is known, and during development against non-production networks.

`networkLabel` applies the same rule:

```ts
export function networkLabel(network: string | null | undefined): string {
    if (network === 'PUBLIC') return 'Mainnet';
    if (network === 'TESTNET') return 'Testnet';
    return 'Testnet'; // fallback — UI is never blank
}
```

---

## 5. Network Normalization

When Freighter reports the active network it returns a raw `string` (e.g.
`'TESTNET'`, `'PUBLIC'`, or potentially other values for custom networks).
`WalletContext` normalizes this before storing it:

```ts
// src/context/WalletContext.tsx
const normalizeNetwork = (networkName: string): WalletNetwork => {
    return networkName === 'PUBLIC' ? 'PUBLIC' : 'TESTNET';
};
```

Any value that is not the **exact string** `'PUBLIC'` is treated as `'TESTNET'`.
This mirrors the Testnet fallback pattern used by the explorer utilities and
ensures that future Stellar network identifiers (e.g. Futurenet) degrade
gracefully to Testnet behaviour in the UI.

The normalized value is set on the context as `network: WalletNetwork | null`
and is `null` until the wallet connects.

---

## 6. Checklist — Adding or Changing a Network

Follow these steps when adding a third network or updating an existing URL or
issuer address.

### Adding a new network

- [ ] Add the new identifier to the `WalletNetwork` union type in
  `src/context/WalletContext.tsx`:
  ```ts
  export type WalletNetwork = 'TESTNET' | 'PUBLIC' | 'FUTURENET';
  ```
- [ ] Add the Horizon URL to `HORIZON_URLS` in `src/utils/horizon.ts`.
- [ ] Add the USDC issuer address to `USDC_ISSUERS` in `src/utils/horizon.ts`.
  Verify the issuer address from a trusted source before committing.
- [ ] Add the explorer base URL to `EXPLORER_BASES` in `src/utils/explorer.ts`.
- [ ] Update `normalizeNetwork` in `src/context/WalletContext.tsx` to handle
  the new identifier (or confirm the Testnet fallback is acceptable).
- [ ] Update `networkLabel` in `src/utils/explorer.ts` to return a
  human-readable label for the new identifier.
- [ ] Update `getExplorerTxUrl` and `getExplorerAccountUrl` if their current
  binary `network === 'PUBLIC'` ternary needs to distinguish more than two
  networks.
- [ ] Add/update tests for every changed function.
- [ ] Update this document and the table in section 3.

### Changing an existing Horizon URL

- [ ] Update the relevant entry in `HORIZON_URLS`.
- [ ] Confirm the new endpoint returns the expected account response shape
  (particularly the `balances` array).
- [ ] Run `fetchUsdcBalance` integration tests against the new URL in a
  staging environment.

### Changing a USDC issuer address

- [ ] Verify the replacement address against the official Circle / Centre
  documentation (or the equivalent authority for the target network).
- [ ] Update `USDC_ISSUERS[network]` in `src/utils/horizon.ts`.
- [ ] Ensure existing accounts with a trustline to the old issuer are handled
  in the migration plan — `hasTrustline` will return `false` until users
  establish a new trustline to the replacement issuer.

---

## 7. Related Files

| File | Role |
|---|---|
| [`src/utils/horizon.ts`](../src/utils/horizon.ts) | `HORIZON_URLS`, `USDC_ISSUERS`, `fetchUsdcBalance`, `HorizonBalanceError` |
| [`src/utils/explorer.ts`](../src/utils/explorer.ts) | `EXPLORER_BASES`, `getExplorerTxUrl`, `getExplorerAccountUrl`, `contractExplorerUrl`, `networkLabel` |
| [`src/context/WalletContext.tsx`](../src/context/WalletContext.tsx) | `WalletNetwork` type, `normalizeNetwork`, `fetchNetworkAndBalance` |
| [`src/utils/stellarAddress.ts`](../src/utils/stellarAddress.ts) | `isValidStellarAddress` — used by explorer helpers to guard empty/invalid addresses |
