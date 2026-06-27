// Pure TypeScript utility — zero React imports.
// Types mirror the real ValidationTask shape in src/Zustand/Store.ts.
// The deadline countdown field in the store is `daysRemaining: number`.
// The resolution status field is `status: 'pending' | 'approved' | 'rejected'`.

export type PendingTask = {
  id: string;
  vaultName: string;
  owner: string;
  amount: string;
  deadline: string;       // ISO date string — not used for metrics
  daysRemaining: number;  // numeric countdown used for overdue/urgent logic
  status: 'pending' | 'approved' | 'rejected';
  milestone: string;
  evidenceUrl?: string;
  notes?: string;
};

export type HistoryRecord = {
  id: string;
  vaultName: string;
  owner: string;
  amount: string;
  deadline: string;
  daysRemaining: number;
  status: 'pending' | 'approved' | 'rejected';
  milestone: string;
  evidenceUrl?: string;
  notes?: string;
};

export type VerifierMetricsResult = {
  /** Percentage (0-100) of history records with status === 'approved'. */
  approvalRate: number;
  /** Count of pending tasks where daysRemaining <= 0. */
  overdueCount: number;
  /** Count of pending tasks where 0 < daysRemaining <= 3 (mutually exclusive with overdue). */
  urgentCount: number;
  /** Total number of history records. */
  totalResolved: number;
};

/**
 * Computes summary metrics from the verifier store's pending and history arrays.
 *
 * Rules:
 * - `overdueCount`: daysRemaining <= 0  (includes exactly 0)
 * - `urgentCount`:  0 < daysRemaining <= 3  (mutually exclusive with overdue)
 * - `approvalRate`: 0 when history is empty (zero-division guard)
 */
export function computeVerifierMetrics(
  pending: PendingTask[],
  history: HistoryRecord[],
): VerifierMetricsResult {
  const totalResolved = history.length;

  const approvedCount = history.filter((r) => r.status === 'approved').length;
  const approvalRate = totalResolved === 0 ? 0 : (approvedCount / totalResolved) * 100;

  const overdueCount = pending.filter((t) => t.daysRemaining <= 0).length;
  const urgentCount = pending.filter(
    (t) => t.daysRemaining > 0 && t.daysRemaining <= 3,
  ).length;

  return { approvalRate, overdueCount, urgentCount, totalResolved };
}
