/**
 * vaultService.test.ts
 *
 * Unit tests for the Promise-based vault data layer.
 * Aim: 95%+ coverage of vaultService.ts.
 */

import { describe, it, expect } from "vitest";
import {
  listVaults,
  getVault,
  getTransactions,
  listAllActivity,
} from "../vaultService";

// ── listVaults ────────────────────────────────────────────────────────────────
describe("listVaults()", () => {
  it("returns a Promise", () => {
    const result = listVaults();
    expect(result).toBeInstanceOf(Promise);
  });

  it("resolves to an array of length 4 (matching current mock count)", async () => {
    const vaults = await listVaults();
    expect(Array.isArray(vaults)).toBe(true);
    expect(vaults).toHaveLength(4);
  });

  it("resolves with objects that have the required Vault fields", async () => {
    const vaults = await listVaults();
    for (const v of vaults) {
      expect(typeof v.id).toBe("string");
      expect(typeof v.name).toBe("string");
      expect(typeof v.amount).toBe("number");
      expect(typeof v.currency).toBe("string");
      expect(typeof v.status).toBe("string");
      expect(typeof v.createdAt).toBe("string");
      expect(typeof v.deadline).toBe("string");
      expect(Array.isArray(v.milestones)).toBe(true);
      expect(Array.isArray(v.transactions)).toBe(true);
    }
  });

  it("includes all four vault ids", async () => {
    const vaults = await listVaults();
    const ids = vaults.map((v) => v.id).sort();
    expect(ids).toEqual(["1", "2", "3", "4"]);
  });
});

// ── getVault ──────────────────────────────────────────────────────────────────
describe("getVault()", () => {
  it("returns a Promise", () => {
    const result = getVault("1");
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves to a Vault with name "Alpha Vault" for id "1"', async () => {
    const vault = await getVault("1");
    expect(vault).toBeDefined();
    expect(vault!.id).toBe("1");
    expect(vault!.name).toBe("Alpha Vault");
    expect(vault!.status).toBe("active");
    expect(vault!.amount).toBe(12500);
    expect(vault!.currency).toBe("USDC");
  });

  it('resolves to a Vault with name "Beta Reserve" for id "2"', async () => {
    const vault = await getVault("2");
    expect(vault).toBeDefined();
    expect(vault!.name).toBe("Beta Reserve");
    expect(vault!.status).toBe("completed");
    expect(vault!.amount).toBe(4200.5);
  });

  it('resolves to a Vault with name "Gamma Fund" for id "3"', async () => {
    const vault = await getVault("3");
    expect(vault).toBeDefined();
    expect(vault!.name).toBe("Gamma Fund");
    expect(vault!.status).toBe("failed");
  });

  it('resolves to a Vault with name "Delta Cancelled" for id "4"', async () => {
    const vault = await getVault("4");
    expect(vault).toBeDefined();
    expect(vault!.name).toBe("Delta Cancelled");
    expect(vault!.status).toBe("cancelled");
  });

  it("resolves to undefined for an unknown id — does NOT throw", async () => {
    const vault = await getVault("unknown-id");
    expect(vault).toBeUndefined();
  });

  it("resolves to undefined for an empty string id", async () => {
    const vault = await getVault("");
    expect(vault).toBeUndefined();
  });

  it("resolves to undefined for a numeric-looking but non-existent id", async () => {
    const vault = await getVault("999");
    expect(vault).toBeUndefined();
  });
});

// ── getTransactions ───────────────────────────────────────────────────────────
describe("getTransactions()", () => {
  it("returns a Promise", () => {
    const result = getTransactions("1");
    expect(result).toBeInstanceOf(Promise);
  });

  it("resolves to a non-empty VaultTransaction[] for vault id \"1\"", async () => {
    const txs = await getTransactions("1");
    expect(Array.isArray(txs)).toBe(true);
    expect(txs.length).toBeGreaterThan(0);
  });

  it("every VaultTransaction for vault \"1\" has required fields", async () => {
    const txs = await getTransactions("1");
    for (const tx of txs) {
      expect(typeof tx.id).toBe("string");
      expect(typeof tx.type).toBe("string");
      expect(typeof tx.hash).toBe("string");
      expect(typeof tx.timestamp).toBe("string");
    }
  });

  it("vault \"1\" has a create transaction as its first entry", async () => {
    const txs = await getTransactions("1");
    expect(txs[0].type).toBe("create");
    expect(txs[0].amount).toBe(12500);
  });

  it("resolves to an empty array for an unknown id — does NOT throw", async () => {
    const txs = await getTransactions("unknown-id");
    expect(Array.isArray(txs)).toBe(true);
    expect(txs).toHaveLength(0);
  });

  it("resolves to an empty array for an empty string id", async () => {
    const txs = await getTransactions("");
    expect(txs).toHaveLength(0);
  });

  it("vault \"2\" transactions include a release entry", async () => {
    const txs = await getTransactions("2");
    const types = txs.map((t) => t.type);
    expect(types).toContain("release");
  });

  it("vault \"3\" transactions include a redirect entry", async () => {
    const txs = await getTransactions("3");
    const types = txs.map((t) => t.type);
    expect(types).toContain("redirect");
  });
});

// ── listAllActivity ───────────────────────────────────────────────────────────
describe("listAllActivity()", () => {
  it("returns a Promise", () => {
    const result = listAllActivity();
    expect(result).toBeInstanceOf(Promise);
  });

  it("resolves to an array matching the original MOCK_TRANSACTIONS length (10)", async () => {
    const activity = await listAllActivity();
    expect(Array.isArray(activity)).toBe(true);
    expect(activity).toHaveLength(10);
  });

  it("every VaultActivityRecord has all required fields", async () => {
    const activity = await listAllActivity();
    for (const record of activity) {
      expect(typeof record.id).toBe("string");
      expect(typeof record.type).toBe("string");
      expect(typeof record.vault).toBe("string");
      expect(typeof record.amount).toBe("number");
      expect(typeof record.fee).toBe("number");
      expect(typeof record.block).toBe("number");
      expect(typeof record.hash).toBe("string");
      expect(typeof record.status).toBe("string");
      expect(typeof record.from).toBe("string");
      expect(typeof record.to).toBe("string");
      expect(record.timestamp).toBeInstanceOf(Date);
      expect(typeof record.memo).toBe("string");
    }
  });

  it("first record is the Alpha Vault create transaction", async () => {
    const activity = await listAllActivity();
    const first = activity[0];
    expect(first.id).toBe("tx1");
    expect(first.type).toBe("create");
    expect(first.vault).toBe("Alpha Vault");
    expect(first.amount).toBe(12500.0);
    expect(first.status).toBe("confirmed");
  });

  it("returns a fresh copy each call (mutations don't bleed across calls)", async () => {
    const a = await listAllActivity();
    a.push({ id: "extra" } as never);
    const b = await listAllActivity();
    expect(b).toHaveLength(10);
  });

  it("includes records with all four transaction types", async () => {
    const activity = await listAllActivity();
    const types = new Set(activity.map((r) => r.type));
    expect(types.has("create")).toBe(true);
    expect(types.has("validate")).toBe(true);
    expect(types.has("release")).toBe(true);
    expect(types.has("redirect")).toBe(true);
  });

  it("includes records with all three status values", async () => {
    const activity = await listAllActivity();
    const statuses = new Set(activity.map((r) => r.status));
    expect(statuses.has("confirmed")).toBe(true);
    expect(statuses.has("pending")).toBe(true);
    expect(statuses.has("failed")).toBe(true);
  });
});
