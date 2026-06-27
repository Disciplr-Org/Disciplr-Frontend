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
