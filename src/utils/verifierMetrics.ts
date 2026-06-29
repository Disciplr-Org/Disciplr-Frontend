import type { ValidationTask } from '../Zustand/Store';

export const CRITICAL_DAYS_THRESHOLD = 3;

export interface VerifierMetrics {
  pendingCount: number;
  overdueCount: number;
  criticalCount: number;
  approvalRate: number;
  urgentCount: number;
  totalResolved: number;
}

export function computeVerifierMetrics(
  pending: ValidationTask[] | undefined | null,
  history: ValidationTask[] | undefined | null,
): VerifierMetrics {
  const safePending = pending ?? [];
  const safeHistory = history ?? [];

  let overdueCount = 0;
  let criticalCount = 0;

  for (const task of safePending) {
    if (task.daysRemaining <= 0) overdueCount++;
    if (task.daysRemaining <= CRITICAL_DAYS_THRESHOLD) criticalCount++;
  }

  let approved = 0;
  let decided = 0;
  for (const task of safeHistory) {
    if (task.status === 'approved') {
      approved++;
      decided++;
    } else if (task.status === 'rejected') {
      decided++;
    }
  }

  const approvalRate = decided === 0 ? 0 : approved / decided;

  return {
    pendingCount: safePending.length,
    overdueCount,
    criticalCount,
    approvalRate,
    urgentCount: criticalCount,
    totalResolved: decided,
  };
}
