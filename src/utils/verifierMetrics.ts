import type { ValidationTask } from '../Zustand/Store';

/**
 * Pending validations whose remaining deadline is less than or equal to this
 * many days are considered "critical" — i.e. they need attention soon and
 * include anything that is already overdue. This mirrors the urgent-red
 * threshold used in the PendingValidations row markup.
 */
export const CRITICAL_DAYS_THRESHOLD = 3;

export interface VerifierMetrics {
  /** Number of tasks still awaiting a decision. */
  pendingCount: number;
  /** Pending tasks whose deadline has passed (daysRemaining <= 0). */
  overdueCount: number;
  /** Pending tasks whose deadline is at or below CRITICAL_DAYS_THRESHOLD. */
  criticalCount: number;
  /**
   * Approved decisions divided by all decided (approved + rejected) history
   * entries. Always a finite number in [0, 1] — empty history returns 0 so
   * the rendered percentage never reads "NaN%" or "Infinity%".
   */
  approvalRate: number;
}

/**
 * Compute the queue-at-a-glance metrics for the verifier dashboard.
 *
 * Pure / presentational: no React, no store reads, no logging. Both inputs
 * are read-only — useful for unit tests, server-side rendering, and any
 * location that wants the numbers without mounting the chart component.
 *
 * Accepts `undefined` / `null` inputs as equivalent to an empty list so
 * callers that only hydrate part of the store (e.g. test mocks, server-side
 * partial renders) can still invoke the function safely.
 */
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

  // Division guard: empty history returns 0% rather than NaN.
  const approvalRate = decided === 0 ? 0 : approved / decided;

  return {
    pendingCount: safePending.length,
    overdueCount,
    criticalCount,
    approvalRate,
  };
}
