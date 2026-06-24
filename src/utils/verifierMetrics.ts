import type { ValidationTask } from '../Zustand/Store';

export interface VerifierMetricsSummary {
  approvalRate: number;
  approvedResolved: number;
  rejectedResolved: number;
  totalResolved: number;
  overduePending: number;
  urgentPending: number;
}

export function computeVerifierMetrics(
  pending: ValidationTask[],
  history: ValidationTask[],
): VerifierMetricsSummary {
  const approvedResolved = history.filter((task) => task.status === 'approved').length;
  const rejectedResolved = history.filter((task) => task.status === 'rejected').length;
  const totalResolved = approvedResolved + rejectedResolved;
  const approvalRate = totalResolved === 0
    ? 0
    : Math.round((approvedResolved / totalResolved) * 100);

  return {
    approvalRate,
    approvedResolved,
    rejectedResolved,
    totalResolved,
    overduePending: pending.filter((task) => task.daysRemaining <= 0).length,
    urgentPending: pending.filter((task) => task.daysRemaining <= 3).length,
  };
}
