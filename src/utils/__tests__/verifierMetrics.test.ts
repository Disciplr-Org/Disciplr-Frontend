import { describe, expect, it } from 'vitest';
import type { ValidationTask } from '../../Zustand/Store';
import { CRITICAL_DAYS_THRESHOLD, computeVerifierMetrics } from '../verifierMetrics';

// ── helpers ──────────────────────────────────────────────────────────────────
function task(overrides: Partial<ValidationTask> = {}): ValidationTask {
  return {
    id: 't',
    vaultName: 'V',
    owner: '0xowner',
    amount: '1,000 USDC',
    deadline: '2026-01-01',
    daysRemaining: 5,
    status: 'pending',
    milestone: 'M',
    ...overrides,
  };
}

// ── constant ─────────────────────────────────────────────────────────────────
describe('CRITICAL_DAYS_THRESHOLD', () => {
  it('is 3 days (matches the queue urgent-red threshold)', () => {
    expect(CRITICAL_DAYS_THRESHOLD).toBe(3);
  });
});

// ── pendingCount ─────────────────────────────────────────────────────────────
describe('computeVerifierMetrics — pendingCount', () => {
  it('counts every entry in the pending list', () => {
    expect(
      computeVerifierMetrics(
        [task({ id: 'a' }), task({ id: 'b' }), task({ id: 'c' })],
        [],
      ).pendingCount,
    ).toBe(3);
  });

  it('is 0 when pending is empty', () => {
    expect(computeVerifierMetrics([], []).pendingCount).toBe(0);
  });
});

// ── overdueCount ─────────────────────────────────────────────────────────────
describe('computeVerifierMetrics — overdueCount', () => {
  it('counts 0 days remaining as overdue', () => {
    expect(
      computeVerifierMetrics([task({ daysRemaining: 0 })], []).overdueCount,
    ).toBe(1);
  });

  it('counts negative days remaining as overdue', () => {
    expect(
      computeVerifierMetrics([task({ daysRemaining: -5 })], []).overdueCount,
    ).toBe(1);
  });

  it('does not count positive days remaining as overdue', () => {
    expect(
      computeVerifierMetrics(
        [task({ id: 'a', daysRemaining: 1 }), task({ id: 'b', daysRemaining: 30 })],
        [],
      ).overdueCount,
    ).toBe(0);
  });

  it('returns the total length when every pending task is overdue ("all overdue")', () => {
    expect(
      computeVerifierMetrics(
        [task({ daysRemaining: 0 }), task({ daysRemaining: -1 }), task({ daysRemaining: -10 })],
        [],
      ).overdueCount,
    ).toBe(3);
  });
});

// ── criticalCount ────────────────────────────────────────────────────────────
describe('computeVerifierMetrics — criticalCount', () => {
  it('counts tasks at or below the critical threshold (≤ 3 days)', () => {
    expect(
      computeVerifierMetrics(
        [
          task({ id: 'a', daysRemaining: 3 }),
          task({ id: 'b', daysRemaining: 2 }),
          task({ id: 'c', daysRemaining: 0 }),
          task({ id: 'd', daysRemaining: 8 }),
        ],
        [],
      ).criticalCount,
    ).toBe(3);
  });

  it('returns 0 ("no critical") when every task has more than the threshold', () => {
    expect(
      computeVerifierMetrics(
        [task({ id: 'a', daysRemaining: 4 }), task({ id: 'b', daysRemaining: 30 })],
        [],
      ).criticalCount,
    ).toBe(0);
  });

  it('treats every overdue task as also critical (critical is a superset of overdue)', () => {
    const m = computeVerifierMetrics(
      [task({ id: 'a', daysRemaining: -3 }), task({ id: 'b', daysRemaining: -1 })],
      [],
    );
    expect(m.overdueCount).toBe(2);
    expect(m.criticalCount).toBe(2);
  });

  it('does not include beyond-threshold tasks in either overdue or critical', () => {
    const m = computeVerifierMetrics(
      [task({ id: 'a', daysRemaining: 4 }), task({ id: 'b', daysRemaining: 30 })],
      [],
    );
    expect(m.overdueCount).toBe(0);
    expect(m.criticalCount).toBe(0);
  });
});

// ── approvalRate (division guard / empty history) ────────────────────────────
describe('computeVerifierMetrics — approvalRate', () => {
  it('returns 0 when history is empty (division guard, no NaN/Infinity)', () => {
    const m = computeVerifierMetrics([], []);
    expect(m.approvalRate).toBe(0);
    expect(Number.isFinite(m.approvalRate)).toBe(true);
  });

  it('returns 0 when history is empty even with pending tasks', () => {
    const m = computeVerifierMetrics([task({ daysRemaining: 5 })], []);
    expect(m.approvalRate).toBe(0);
  });

  it('returns 1 when every history item is approved', () => {
    const history = [
      task({ id: 'h1', status: 'approved' }),
      task({ id: 'h2', status: 'approved' }),
    ];
    expect(computeVerifierMetrics([], history).approvalRate).toBe(1);
  });

  it('returns 0 when every history item is rejected', () => {
    const history = [
      task({ id: 'h1', status: 'rejected' }),
      task({ id: 'h2', status: 'rejected' }),
    ];
    expect(computeVerifierMetrics([], history).approvalRate).toBe(0);
  });

  it('returns the ratio of approved to decided when history has both kinds', () => {
    const history = [
      task({ id: 'h1', status: 'approved' }),
      task({ id: 'h2', status: 'approved' }),
      task({ id: 'h3', status: 'approved' }),
      task({ id: 'h4', status: 'rejected' }),
    ];
    expect(computeVerifierMetrics([], history).approvalRate).toBeCloseTo(0.75, 5);
  });

  it('ignores history entries that are still pending', () => {
    const history = [
      task({ id: 'h1', status: 'pending' }),
      task({ id: 'h2', status: 'approved' }),
    ];
    expect(computeVerifierMetrics([], history).approvalRate).toBe(1);
  });
});

// ── combined / mixed snapshots ───────────────────────────────────────────────
describe('computeVerifierMetrics — combined', () => {
  it('produces all four metrics for a realistic mixed snapshot', () => {
    const pending = [
      task({ id: 'p1', daysRemaining: 0 }), // overdue + critical
      task({ id: 'p2', daysRemaining: 2 }), // critical only
      task({ id: 'p3', daysRemaining: 10 }), // neither
    ];
    const history = [
      task({ id: 'h1', status: 'approved' }),
      task({ id: 'h2', status: 'approved' }),
      task({ id: 'h3', status: 'rejected' }),
    ];
    expect(computeVerifierMetrics(pending, history)).toEqual({
      pendingCount: 3,
      overdueCount: 1,
      criticalCount: 2,
      approvalRate: 2 / 3,
    });
  });

  it('handles a fully empty store (pending and history both empty)', () => {
    expect(computeVerifierMetrics([], [])).toEqual({
      pendingCount: 0,
      overdueCount: 0,
      criticalCount: 0,
      approvalRate: 0,
    });
  });

  it('keeps results stable when called twice with the same inputs', () => {
    const pending = [task({ daysRemaining: -1 }), task({ daysRemaining: 2 })];
    const history = [task({ status: 'approved' }), task({ status: 'rejected' })];
    expect(computeVerifierMetrics(pending, history)).toEqual(
      computeVerifierMetrics(pending, history),
    );
  });
});

// ── defensive against missing inputs ────────────────────────────────────────
describe('computeVerifierMetrics — defensive defaults', () => {
  it('treats undefined pending as an empty queue', () => {
    const m = computeVerifierMetrics(undefined, [task({ status: 'approved' })]);
    expect(m).toEqual({
      pendingCount: 0,
      overdueCount: 0,
      criticalCount: 0,
      approvalRate: 1,
    });
  });

  it('treats null history as an empty history (0% rate, no throw)', () => {
    const m = computeVerifierMetrics([task()], null);
    expect(m.pendingCount).toBe(1);
    expect(m.approvalRate).toBe(0);
    expect(Number.isFinite(m.approvalRate)).toBe(true);
  });

  it('returns an all-zero metrics object for two undefined inputs', () => {
    expect(computeVerifierMetrics(undefined, undefined)).toEqual({
      pendingCount: 0,
      overdueCount: 0,
      criticalCount: 0,
      approvalRate: 0,
    });
import { describe, it, expect } from 'vitest';
import { computeVerifierMetrics, PendingTask, HistoryRecord } from '../../utils/verifierMetrics';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makePending = (daysRemaining: number, id = 'p-1'): PendingTask => ({
  id,
  vaultName: 'Test Vault',
  owner: '0xabc',
  amount: '1,000 USDC',
  deadline: '2026-01-01',
  daysRemaining,
  status: 'pending',
  milestone: 'Test Milestone',
});

const makeHistory = (status: 'approved' | 'rejected', id = 'h-1'): HistoryRecord => ({
  id,
  vaultName: 'Test Vault',
  owner: '0xabc',
  amount: '1,000 USDC',
  deadline: '2026-01-01',
  daysRemaining: 0,
  status,
  milestone: 'Test Milestone',
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeVerifierMetrics', () => {
  it('returns approvalRate === 0 and totalResolved === 0 for empty history', () => {
    const result = computeVerifierMetrics([], []);
    expect(result.approvalRate).toBe(0);
    expect(result.totalResolved).toBe(0);
    expect(result.overdueCount).toBe(0);
    expect(result.urgentCount).toBe(0);
  });

  it('returns approvalRate === 0 — no NaN — when history is empty', () => {
    const result = computeVerifierMetrics([makePending(5)], []);
    expect(Number.isNaN(result.approvalRate)).toBe(false);
    expect(result.approvalRate).toBe(0);
  });

  it('returns approvalRate === 100 when all history records are approved', () => {
    const history = [makeHistory('approved', 'h-1'), makeHistory('approved', 'h-2')];
    const result = computeVerifierMetrics([], history);
    expect(result.approvalRate).toBe(100);
    expect(result.totalResolved).toBe(2);
  });

  it('returns correct percentage for mixed approved/rejected history', () => {
    // 2 approved, 1 rejected → 2/3 × 100 ≈ 66.666...
    const history = [
      makeHistory('approved', 'h-1'),
      makeHistory('approved', 'h-2'),
      makeHistory('rejected', 'h-3'),
    ];
    const result = computeVerifierMetrics([], history);
    expect(result.approvalRate).toBeCloseTo((2 / 3) * 100, 5);
    expect(result.totalResolved).toBe(3);
  });

  it('counts daysRemaining === 0 as overdue, NOT urgent', () => {
    const result = computeVerifierMetrics([makePending(0)], []);
    expect(result.overdueCount).toBe(1);
    expect(result.urgentCount).toBe(0);
  });

  it('counts daysRemaining < 0 as overdue', () => {
    const result = computeVerifierMetrics([makePending(-2)], []);
    expect(result.overdueCount).toBe(1);
    expect(result.urgentCount).toBe(0);
  });

  it('counts daysRemaining === 3 as urgent', () => {
    const result = computeVerifierMetrics([makePending(3)], []);
    expect(result.urgentCount).toBe(1);
    expect(result.overdueCount).toBe(0);
  });

  it('counts daysRemaining === 1 as urgent', () => {
    const result = computeVerifierMetrics([makePending(1)], []);
    expect(result.urgentCount).toBe(1);
    expect(result.overdueCount).toBe(0);
  });

  it('counts daysRemaining === 4 as neither overdue nor urgent', () => {
    const result = computeVerifierMetrics([makePending(4)], []);
    expect(result.overdueCount).toBe(0);
    expect(result.urgentCount).toBe(0);
  });

  it('returns overdueCount === 0 and urgentCount === 0 when pending is empty', () => {
    const history = [makeHistory('approved')];
    const result = computeVerifierMetrics([], history);
    expect(result.overdueCount).toBe(0);
    expect(result.urgentCount).toBe(0);
  });

  it('correctly classifies multiple pending tasks at once', () => {
    const pending = [
      makePending(-1, 'p-1'),  // overdue
      makePending(0, 'p-2'),   // overdue
      makePending(1, 'p-3'),   // urgent
      makePending(3, 'p-4'),   // urgent
      makePending(4, 'p-5'),   // neither
      makePending(10, 'p-6'),  // neither
    ];
    const result = computeVerifierMetrics(pending, []);
    expect(result.overdueCount).toBe(2);
    expect(result.urgentCount).toBe(2);
  });
});
