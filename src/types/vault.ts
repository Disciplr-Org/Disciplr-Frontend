export type VaultStatus =
  | "active"
  | "completed"
  | "failed"
  | "cancelled"
  | "pending_validation";

export type MilestoneStatus = "pending" | "validated" | "failed";
export type VaultTransactionType = "create" | "validate" | "release" | "redirect";
export type VaultTransactionStatus = "confirmed" | "pending" | "failed";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  criteria: string;
  status: MilestoneStatus;
  validatedAt?: string;
  evidenceUrl?: string;
}

export interface VaultTransaction {
  id: string;
  type: VaultTransactionType;
  hash: string;
  timestamp: string;
  vaultId?: string;
  vaultName?: string;
  amount?: number;
  fee?: number;
  block?: number;
  status?: VaultTransactionStatus;
  from?: string;
  to?: string;
  memo?: string;
}

export interface Vault {
  id: string;
  name: string;
  status: VaultStatus;
  amount: number;
  currency: string;
  createdAt: string;
  deadline: string;
  creatorAddress: string;
  verifierAddress?: string;
  successAddress: string;
  failureAddress: string;
  contractAddress: string;
  milestones: Milestone[];
  transactions: VaultTransaction[];
}

export interface VaultPreview {
  id: string;
  name: string;
  amount: number;
  currency: string;
  status: VaultStatus;
  progressPct: number;
  deadline: string;
}

export interface DashboardSummary {
  totalLocked: number;
  activeVaults: number;
  pendingMilestones: number;
  completionRate: number;
}

export interface DashboardActivity {
  id: string;
  type: "created" | "validated" | "released" | "redirected";
  vault: string;
  timestamp: string;
  amount?: number;
}

export interface DashboardDeadline {
  id: string;
  name: string;
  deadline: string;
  amount: number;
}
