import { describe, expect, it } from "vitest";
import { vaultService } from "../vaultService";

describe("vaultService", () => {
  it("lists the current vault mocks through the async data layer", async () => {
    const vaults = await vaultService.listVaults();

    expect(vaults.map((vault) => vault.name)).toEqual([
      "Alpha Vault",
      "Beta Reserve",
      "Gamma Fund",
    ]);
    expect(vaults[1]).toMatchObject({
      id: "2",
      amount: 4200.5,
      status: "completed",
    });
  });

  it("returns one typed vault by id and undefined for unknown ids", async () => {
    await expect(vaultService.getVault("1")).resolves.toMatchObject({
      id: "1",
      name: "Alpha Vault",
      milestones: expect.arrayContaining([
        expect.objectContaining({ id: "m1", status: "validated" }),
      ]),
    });

    await expect(vaultService.getVault("missing")).resolves.toBeUndefined();
  });

  it("returns vault-scoped transactions from the required getTransactions seam", async () => {
    const alphaTransactions = await vaultService.getTransactions("1");

    expect(alphaTransactions).toHaveLength(2);
    expect(alphaTransactions.map((transaction) => transaction.type)).toEqual([
      "create",
      "validate",
    ]);
    await expect(vaultService.getTransactions("missing")).resolves.toEqual([]);
  });

  it("lists the transaction-ledger mock for the transactions page", async () => {
    const transactions = await vaultService.listTransactions();

    expect(transactions).toHaveLength(10);
    expect(transactions.some((tx) => tx.status === "pending")).toBe(true);
    expect(transactions.some((tx) => tx.status === "failed")).toBe(true);
  });

  it("returns cloned data so callers cannot mutate the backing mock", async () => {
    const firstRead = await vaultService.listVaults();
    firstRead[0].name = "Mutated Vault";

    const secondRead = await vaultService.listVaults();

    expect(secondRead[0].name).toBe("Alpha Vault");
  });
});
