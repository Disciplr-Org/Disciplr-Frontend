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

// ── Master mock dataset (verbatim from VaultDetail.tsx's MOCK_VAULTS) ─────────
const MASTER_VAULTS: Record<string, Vault> = {
  // Vault 1: active vault
  "1": {
    id: "1",
    name: "Alpha Vault",
    status: "active",
    amount: 12500,
    currency: "USDC",
    createdAt: "2024-01-15T10:00:00Z",
    deadline: "2024-07-15T10:00:00Z",
    creatorAddress: "GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L",
    verifierAddress: "GVERIF3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    successAddress: "GSUCC3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    failureAddress: "GFAIL3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    contractAddress: "GCONT3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    milestones: [
      {
        id: "m1",
        title: "Phase 1 Complete",
        description: "Complete initial development phase",
        criteria: "All unit tests passing, code reviewed",
        status: "validated",
        validatedAt: "2024-02-20T14:30:00Z",
        evidenceUrl: "https://github.com/org/repo/pull/42",
      },
      {
        id: "m2",
        title: "Beta Launch",
        description: "Launch beta version to 100 users",
        criteria: "Beta deployed, 100 active users onboarded",
        status: "pending",
      },
    ],
    transactions: [
      {
        id: "tx1",
        type: "create",
        hash: "a3f9d1c8e2b74056af3d9c1b2e8f0a4d",
        timestamp: "2024-01-15T10:00:00Z",
        amount: 12500,
      },
      {
        id: "tx2",
        type: "validate",
        hash: "b4e0c2d9f3a85167bg4e0d2c3f9a5e8b",
        timestamp: "2024-02-20T14:30:00Z",
      },
    ],
  },
  // Vault 2: completed vault (release) without a verifier address
  "2": {
    id: "2",
    name: "Beta Reserve",
    status: "completed",
    amount: 4200.5,
    currency: "USDC",
    createdAt: "2023-10-01T09:00:00Z",
    deadline: "2024-01-01T09:00:00Z",
    creatorAddress: "GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L",
    successAddress: "GSUCC3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    failureAddress: "GFAIL3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    contractAddress: "GCONT4KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    milestones: [
      {
        id: "m1",
        title: "Project Delivery",
        description: "Deliver final project",
        criteria: "All deliverables submitted and approved",
        status: "validated",
        validatedAt: "2023-12-28T11:00:00Z",
        evidenceUrl: "https://docs.example.com/delivery",
      },
    ],
    transactions: [
      {
        id: "tx1",
        type: "create",
        hash: "e7b3f5a2c6d18490ej7b3a5f6c2d8b1e",
        timestamp: "2023-10-01T09:00:00Z",
        amount: 4200.5,
      },
      {
        id: "tx2",
        type: "validate",
        hash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
        timestamp: "2023-12-28T11:00:00Z",
      },
      {
        id: "tx3",
        type: "release",
        hash: "c5f1d3e0a4b96278ch5f1e3d4a0b6f9c",
        timestamp: "2024-01-01T09:00:00Z",
        amount: 4200.5,
      },
    ],
  },
  // Vault 3: failed vault (redirect)
  "3": {
    id: "3",
    name: "Gamma Fund",
    status: "failed",
    amount: 8800,
    currency: "USDC",
    createdAt: "2023-08-01T08:00:00Z",
    deadline: "2023-12-01T08:00:00Z",
    creatorAddress: "GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L",
    failureAddress: "GFAIL3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    successAddress: "GSUCC3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    contractAddress: "GCONT5KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    milestones: [
      {
        id: "m1",
        title: "Milestone 1",
        description: "First milestone",
        criteria: "Criteria not met",
        status: "failed",
      },
    ],
    transactions: [
      {
        id: "tx1",
        type: "create",
        hash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
        timestamp: "2023-08-01T08:00:00Z",
        amount: 8800,
      },
      {
        id: "tx2",
        type: "redirect",
        hash: "d6a2e4f1b5c07389di6a2f4e5b1c7a0d",
        timestamp: "2023-12-01T08:00:00Z",
        amount: 8800,
      },
    ],
  },
  // Vault 4: cancelled vault with mixed milestone statuses and redirect destination
  "4": {
    id: "4",
    name: "Delta Cancelled",
    status: "cancelled",
    amount: 5000,
    currency: "USDC",
    createdAt: "2023-08-01T08:00:00Z",
    deadline: "2023-12-01T08:00:00Z",
    creatorAddress: "GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L",
    failureAddress: "GFAIL3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    successAddress: "GSUCC3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    contractAddress: "GCONT5KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
    milestones: [
      {
        id: "m1",
        title: "Milestone 1",
        description: "First milestone",
        criteria: "Criteria met",
        status: "validated",
      },
      {
        id: "m2",
        title: "Milestone 2",
        description: "Second milestone",
        criteria: "Criteria not met",
        status: "failed",
      },
      {
        id: "m3",
        title: "Milestone 3",
        description: "Third milestone",
        criteria: "Pending criteria",
        status: "pending",
      },
    ],
    transactions: [
      {
        id: "tx1",
        type: "create",
        hash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
        timestamp: "2023-08-01T08:00:00Z",
        amount: 5000,
      },
      {
        id: "tx2",
        type: "redirect",
        hash: "d6a2e4f1b5c07389di6a2f4e5b1c7a0d",
        timestamp: "2023-12-01T08:00:00Z",
        amount: 5000,
      },
    ],
  },
};

// ── Mock activity dataset (verbatim from VaultTransactions.tsx's MOCK_TRANSACTIONS)
// NOTE: `new Date(Date.now() - ...)` is evaluated at module load time, which
// matches the original runtime behaviour.
const MASTER_ACTIVITY: VaultActivityRecord[] = [
  {
    id: "tx1",
    type: "create",
    vault: "Alpha Vault",
    amount: 12500.0,
    fee: 0.00012,
    block: 48201933,
    hash: "a3f9d1c8e2b74056af3d9c1b2e8f0a4d7c5e9b3f1a2d4c6e8b0f2a4c6d8e0f2a",
    status: "confirmed",
    from: "GBVZ3...QK7L",
    to: "GCVAULT...M3P",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    memo: "Initial deposit",
  },
  {
    id: "tx2",
    type: "validate",
    vault: "Alpha Vault",
    amount: 0,
    fee: 0.00008,
    block: 48202011,
    hash: "b4e0c2d9f3a85167bg4e0d2c3f9a5e8b4c6d0e2f4a6c8e0b2d4f6a8c0e2d4f6a",
    status: "confirmed",
    from: "GBVZ3...QK7L",
    to: "GCVAULT...M3P",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    memo: "",
  },
  {
    id: "tx3",
    type: "release",
    vault: "Beta Reserve",
    amount: 4200.5,
    fee: 0.00015,
    block: 48202450,
    hash: "c5f1d3e0a4b96278ch5f1e3d4a0b6f9c5d7e1f3b5d7f9b1d3f5b7d9f1b3d5f7b",
    status: "confirmed",
    from: "GCVAULT...M3P",
    to: "GBVZ3...QK7L",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    memo: "Milestone payout",
  },
  {
    id: "tx4",
    type: "redirect",
    vault: "Gamma Fund",
    amount: 8800.0,
    fee: 0.00011,
    block: 48202891,
    hash: "d6a2e4f1b5c07389di6a2f4e5b1c7a0d6e8f2a4c6e8a0c2e4f6a8c0e2f4a6c8e",
    status: "pending",
    from: "GCVAULT...M3P",
    to: "GDELTA...X9K",
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    memo: "Redirect to escrow",
  },
  {
    id: "tx5",
    type: "create",
    vault: "Beta Reserve",
    amount: 31000.0,
    fee: 0.00013,
    block: 48201100,
    hash: "e7b3f5a2c6d18490ej7b3a5f6c2d8b1e7f9a3b5d7f9b1d3f5b7d9f1b3d5f7b9d",
    status: "confirmed",
    from: "GBVZ3...QK7L",
    to: "GCVAULT...M3P",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    memo: "New vault",
  },
  {
    id: "tx6",
    type: "release",
    vault: "Alpha Vault",
    amount: 500.0,
    fee: 0.00009,
    block: 48203100,
    hash: "f8c4a6b3d7e29501fk8c4b6a7d3e9c2f8a0c4b6d8f0b2d4f6a8b0d2f4a6b8d0f",
    status: "failed",
    from: "GCVAULT...M3P",
    to: "GBVZ3...QK7L",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    memo: "Partial release",
  },
  {
    id: "tx7",
    type: "validate",
    vault: "Gamma Fund",
    amount: 0,
    fee: 0.00007,
    block: 48201788,
    hash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    status: "confirmed",
    from: "GBVZ3...QK7L",
    to: "GCVAULT...M3P",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5),
    memo: "",
  },
  {
    id: "tx8",
    type: "redirect",
    vault: "Alpha Vault",
    amount: 1200.75,
    fee: 0.0001,
    block: 48203222,
    hash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    status: "pending",
    from: "GCVAULT...M3P",
    to: "GBVZ3...QK7L",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    memo: "Reallocation",
  },
  {
    id: "tx9",
    type: "create",
    vault: "Delta Safe",
    amount: 99000.0,
    fee: 0.0002,
    block: 48200500,
    hash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    status: "confirmed",
    from: "GBVZ3...QK7L",
    to: "GCVAULT...M3P",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    memo: "Large vault",
  },
  {
    id: "tx10",
    type: "release",
    vault: "Delta Safe",
    amount: 15000.0,
    fee: 0.00016,
    block: 48203400,
    hash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    status: "confirmed",
    from: "GCVAULT...M3P",
    to: "GBVZ3...QK7L",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    memo: "Q3 release",
  },
];

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
