/**
 * vaultService.ts
 *
 * Promise-based data layer for vault operations.
 *
 * Currently backed by mock data copied verbatim from VaultDetail.tsx
 * (the canonical source). Replace only the internals of each function
 * with real Soroban/Horizon calls when the backend is ready — the page
 * components depend only on the Promise-based interface and will need
 * zero changes.
 */

import type { Vault, VaultTransaction } from "../types/vault";
import { MASTER_VAULTS } from "../fixtures/vaults";
import { MASTER_ACTIVITY } from "../fixtures/transactions";

// ── Re-export canonical types for consumers that need them ────────────────────
export type { Vault, VaultTransaction };

// ── Rich transaction record for the all-vaults explorer page ─────────────────
// NOT the same as VaultTransaction — this type carries fee, block, from/to/memo
// data that is specific to the VaultTransactions explorer view.
export interface VaultActivityRecord {
  id: string;
  type: "create" | "validate" | "release" | "redirect";
  vault: string;
  amount: number;
  fee: number;
  block: number;
  hash: string;
  status: "confirmed" | "pending" | "failed";
  from: string;
  to: string;
  timestamp: Date;
  memo: string;
}

// ── Mock datasets moved to src/fixtures/ ──────────────────────────────────────
// MASTER_VAULTS lives in src/fixtures/vaults.ts and MASTER_ACTIVITY in
// src/fixtures/transactions.ts. They are imported above so this module stays a
// thin Promise-based seam. See docs/VAULT_DATA_LAYER.md.

// ── Service API ───────────────────────────────────────────────────────────────
// SEAM: Replace only the internals of these functions with Soroban/Horizon calls
// when the real backend lands. Page components depend solely on the
// Promise-based interface below and will need zero changes.

/**
 * Return all vaults.
 *
 * SEAM → replace with: Horizon account fetch + Soroban contract reads.
 */
export async function listVaults(): Promise<Vault[]> {
  return Object.values(MASTER_VAULTS);
}

/**
 * Return a single vault by id, or undefined if not found.
 * Does NOT throw for unknown ids — callers rely on the undefined branch.
 *
 * SEAM → replace with: Soroban contract state read for a given contract address.
 */
export async function getVault(id: string): Promise<Vault | undefined> {
  return MASTER_VAULTS[id];
}

/**
 * Return the on-chain transactions stored on a specific vault.
 * Returns [] for unknown ids.
 *
 * SEAM → replace with: Horizon `/transactions?account=<contractAddress>` + filter.
 */
export async function getTransactions(id: string): Promise<VaultTransaction[]> {
  return MASTER_VAULTS[id]?.transactions ?? [];
}

/**
 * Return the rich activity feed used by the VaultTransactions explorer page.
 *
 * SEAM → replace with: Horizon transaction stream aggregated across all vault
 * contract addresses.
 */
export async function listAllActivity(): Promise<VaultActivityRecord[]> {
  return [...MASTER_ACTIVITY];
}
