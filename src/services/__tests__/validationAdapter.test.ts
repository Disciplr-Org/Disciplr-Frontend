import { describe, expect, it } from "vitest";
import type { ApiVault } from "../api";
import {
  isPendingApiMilestone,
  mapApiMilestoneToValidationTask,
  mapApiVaultsToValidationTasks,
} from "../validationAdapter";
import { formatUsdc } from "../../utils/format";

const vault: ApiVault = {
  id: "vault-1",
  name: "API Vault",
  creator: "GOWNER",
  amount: "5000",
  status: "active",
  startDate: "2026-01-01T00:00:00.000Z",
  endDate: "2026-12-31T00:00:00.000Z",
  verifier: "GVERIFIER",
  successDestination: "GSUCCESS",
  failureDestination: "GFAILURE",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  milestones: [
    {
      id: "milestone-1",
      title: "Ship release",
      amount: "2500",
      dueDate: "2026-06-01",
      status: "pending",
    },
    {
      id: "milestone-2",
      title: "Completed work",
      amount: "2500",
      dueDate: "2026-05-01",
      status: "completed",
    },
    {
      id: "milestone-3",
      title: "Under review",
      amount: "2500",
      dueDate: "2026-07-01",
      status: "pending_validation",
    },
  ],
};

describe("validationAdapter", () => {
  it("maps a pending API milestone state to a ValidationTask", () => {
    expect(mapApiMilestoneToValidationTask(vault, vault.milestones[0])).toEqual({
      id: "vault-1:milestone-1",
      vaultId: "vault-1",
      milestoneId: "milestone-1",
      vaultName: "API Vault",
      owner: "GOWNER",
      amount: `${formatUsdc("2500")} USDC`,
      deadline: "2026-06-01",
      status: "pending",
      milestone: "Ship release",
      assignedVerifier: "GVERIFIER",
    });
  });

  it("only maps pending milestone states across all vaults", () => {
    const tasks = mapApiVaultsToValidationTasks([vault]);

    expect(tasks.map((task) => task.id)).toEqual([
      "vault-1:milestone-1",
      "vault-1:milestone-3",
    ]);
    expect(isPendingApiMilestone(vault.milestones[1])).toBe(false);
  });

  it("falls back to a generated vault name when the API omits one", () => {
    const task = mapApiMilestoneToValidationTask(
      { ...vault, name: "   " },
      vault.milestones[0],
    );

    expect(task.vaultName).toBe("Vault vault-1");
  });
});
