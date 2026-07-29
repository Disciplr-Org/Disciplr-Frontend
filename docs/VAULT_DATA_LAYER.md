# Vault Data Layer — Architecture & Migration Guide

## Overview

`src/services/vaultService.ts` is the **single data layer** for all vault operations in Disciplr-Frontend. It exposes a small, Promise-based API that page components call via `useEffect`. All mock data lives here; when the Soroban/Horizon backend is ready, only the *internals* of this file need to change.

---

## Current Implementation (Mock-backed)

The service is backed by two in-memory datasets:

| Dataset | Type | Description |
|---|---|---|
| `MASTER_VAULTS` | `Record<string, Vault>` | 4 canonical vaults (ids `"1"`–`"4"`) |
| `MASTER_ACTIVITY` | `VaultActivityRecord[]` | 10 activity records for the explorer page |

### Exported API

| Function | Return type | Description |
|---|---|---|
| `listVaults()` | `Promise<Vault[]>` | Returns all vaults |
| `getVault(id)` | `Promise<Vault \| undefined>` | Returns one vault, or `undefined` for unknown ids (never throws) |
| `getTransactions(id)` | `Promise<VaultTransaction[]>` | Returns a vault's inline transactions, or `[]` for unknown ids |
| `listAllActivity()` | `Promise<VaultActivityRecord[]>` | Returns rich activity records for the explorer page |

### Type Exports

| Type | Source | Purpose |
|---|---|---|
| `Vault` | `src/types/vault.ts` | Re-exported for consumers |
| `VaultTransaction` | `src/types/vault.ts` | Lightweight tx embedded in a Vault |
| `VaultActivityRecord` | `vaultService.ts` | Rich tx record with `fee`, `block`, `from`, `to`, `memo` |

> **Important distinction:** `VaultTransaction` (embedded in `Vault`) and `VaultActivityRecord` (used by `VaultTransactions.tsx`) are intentionally separate types. Do not merge them — the former is the minimal on-chain receipt stored on the vault; the latter is the full Horizon event record.

---

## Seam: Replacing Mock Data with Real Backend Calls

When the Soroban/Horizon backend is ready, **only the internals** of `vaultService.ts` need to change. Page components consume the Promise-based interface and require zero modifications.

### `listVaults()` → Soroban/Horizon replacement
```ts
// Replace:
return Object.values(MASTER_VAULTS);

// With (example):
const contracts = await fetchUserVaultContracts(walletAddress);
return Promise.all(contracts.map((addr) => readVaultState(addr)));
```

### `getVault(id)` → Soroban replacement
```ts
// Replace:
return MASTER_VAULTS[id];

// With (example):
const contractAddr = await resolveContractAddress(id);
if (!contractAddr) return undefined;
return readVaultState(contractAddr);
```

### `getTransactions(id)` → Horizon replacement
```ts
// Replace:
return MASTER_VAULTS[id]?.transactions ?? [];

// With (example):
const contractAddr = await resolveContractAddress(id);
if (!contractAddr) return [];
const records = await horizon.transactions().forAccount(contractAddr).call();
return records.records.map(toVaultTransaction);
```

### `listAllActivity()` → Horizon stream replacement
```ts
// Replace:
return [...MASTER_ACTIVITY];

// With (example):
const vaults = await listVaults();
const streams = await Promise.all(vaults.map((v) =>
  horizon.transactions().forAccount(v.contractAddress).call()
));
return streams.flatMap((s) => s.records.map(toVaultActivityRecord));
```

---

## Pre-existing Data Inconsistency Resolved

Before this PR, `Dashboard.tsx` and `Vaults.tsx` each declared their own local mock arrays. These **disagreed** with `VaultDetail.tsx` for the same vault ids:

| Vault | VaultDetail (canonical) | Dashboard (old) | Vaults (old) |
|---|---|---|---|
| Beta Reserve (`"2"`) | `amount: 4200.5`, `status: "completed"` | `amount: 8800`, `status: "pending_validation"` | `amount: 4200.5`, `status: "completed"` |
| Gamma Fund (`"3"`) | `amount: 8800`, `status: "failed"` | `amount: 4200`, `status: "active"` | `amount: 8800`, `status: "failed"` |

**Resolution:** `VaultDetail.tsx`'s dataset was treated as canonical and moved verbatim into `vaultService.ts`. Both `Dashboard.tsx` and `Vaults.tsx` now call `listVaults()` and display the canonical values. The inconsistency is fully eliminated.

Additionally, `Dashboard.tsx` previously had a local `VaultStatus` type that was missing the `"cancelled"` variant. It now imports the canonical `VaultStatus` from `src/types/vault.ts`, which includes all five variants.

---

## File Map

```
src/
├── types/
│   └── vault.ts                  ← Canonical types (VaultStatus, Vault, Milestone, VaultTransaction, …)
├── services/
│   ├── vaultService.ts           ← Data layer (all 4 service functions + VaultActivityRecord)
│   └── __tests__/
│       └── vaultService.test.ts  ← Vitest unit tests (95%+ coverage target)
└── pages/
    ├── Dashboard.tsx             ← Calls listVaults() via useEffect; progressPct computed inline
    ├── Vaults.tsx                ← Calls listVaults() as the default fetchVaults
    ├── VaultDetail.tsx           ← Calls getVault(id) via useEffect; loading state added
    └── VaultTransactions.tsx     ← Calls listAllActivity() via useEffect; VAULTS derived from data
```
