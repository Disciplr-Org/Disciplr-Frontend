import type { ApiMilestone, ApiVault } from "./api";
import type { ValidationTask } from "../Zustand/Store";
import { formatUsdc } from "../utils/format";

const PENDING_MILESTONE_STATUSES = new Set([
  "pending",
  "pending_validation",
  "submitted",
  "in_review",
]);

export function isPendingApiMilestone(milestone: ApiMilestone): boolean {
  return PENDING_MILESTONE_STATUSES.has(milestone.status.trim().toLowerCase());
}

export function mapApiMilestoneToValidationTask(
  vault: ApiVault,
  milestone: ApiMilestone,
): ValidationTask {
  let amount = milestone.amount;
  try {
    amount = formatUsdc(milestone.amount);
  } catch {
    amount = milestone.amount;
  }
  return {
    id: `${vault.id}:${milestone.id}`,
    vaultId: vault.id,
    milestoneId: milestone.id,
    vaultName: vault.name?.trim() || `Vault ${vault.id}`,
    owner: vault.creator,
    amount: `${amount} USDC`,
    deadline: milestone.dueDate,
    status: "pending",
    milestone: milestone.title,
    ...(vault.verifier ? { assignedVerifier: vault.verifier } : {}),
  };
}

export function mapApiVaultsToValidationTasks(vaults: ApiVault[]): ValidationTask[] {
  return vaults.flatMap((vault) =>
    vault.milestones
      .filter(isPendingApiMilestone)
      .map((milestone) => mapApiMilestoneToValidationTask(vault, milestone)),
  );
}
