import { afterEach, describe, expect, it, vi } from "vitest";
import { toVault, type ApiVault } from "../api";
import { logger } from "../../utils/logger";

const valid: ApiVault = {
  id: "vault-1",
  name: "Vault 1",
  creator: "GCREATOR",
  amount: "100",
  status: "active",
  startDate: "2026-10-01T00:00:00.000Z",
  endDate: "2026-12-01T00:00:00.000Z",
  verifier: "GVERIFIER",
  successDestination: "GSUCCESS",
  failureDestination: "GFAILURE",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  milestones: [
    {
      id: "m-1",
      title: "Milestone 1",
      amount: "50",
      dueDate: "2026-11-01T00:00:00.000Z",
      status: "pending",
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toVault defensive conversion", () => {
  it("uses 0 and warns with the vault id when amount is not finite", () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    const baseline = toVault(valid);
    const vault = toVault({ ...valid, amount: "abc" });

    expect(vault.amount).toBe(0);
    expect({ ...vault, amount: baseline.amount }).toEqual(baseline);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(valid.id),
      expect.objectContaining({ vaultId: valid.id }),
    );
  });

  it("returns an empty milestones array when milestones is undefined", () => {
    const vault = toVault({ ...valid, milestones: undefined as never });

    expect(vault.milestones).toEqual([]);
  });

  it("does not render NaN USDC for a non-numeric milestone amount", () => {
    const vault = toVault({
      ...valid,
      milestones: [{ ...valid.milestones[0], amount: "abc" }],
    });

    expect(vault.milestones[0].description).not.toContain("NaN");
    expect(vault.milestones[0].description).toContain("0.00 USDC");
  });
});
