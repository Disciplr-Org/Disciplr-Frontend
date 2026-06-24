import { describe, expect, it } from 'vitest';
import type { ValidationTask } from '../../Zustand/Store';
import { computeVerifierMetrics } from '../verifierMetrics';

function task(overrides: Partial<ValidationTask>): ValidationTask {
  return {
    id: overrides.id ?? 'v-1',
    vaultName: overrides.vaultName ?? 'Vault',
    owner: overrides.owner ?? 'GOWNER',
    amount: overrides.amount ?? '1,000 USDC',
    deadline: overrides.deadline ?? '2026-01-01',
    daysRemaining: overrides.daysRemaining ?? 7,
    status: overrides.status ?? 'pending',
    milestone: overrides.milestone ?? 'Milestone',
    notes: overrides.notes,
  };
}

describe('computeVerifierMetrics', () => {
  it('returns zero approval rate when there is no resolved history', () => {
    expect(computeVerifierMetrics([], [])).toMatchObject({
      approvalRate: 0,
      totalResolved: 0,
      approvedResolved: 0,
      rejectedResolved: 0,
    });
  });

  it('returns 100% approval rate when every resolved validation is approved', () => {
    const history = [
      task({ id: 'approved-1', status: 'approved' }),
      task({ id: 'approved-2', status: 'approved' }),
    ];

    expect(computeVerifierMetrics([], history)).toMatchObject({
      approvalRate: 100,
      totalResolved: 2,
      approvedResolved: 2,
      rejectedResolved: 0,
    });
  });

  it('rounds mixed approval rates from approved and rejected history', () => {
    const history = [
      task({ id: 'approved-1', status: 'approved' }),
      task({ id: 'approved-2', status: 'approved' }),
      task({ id: 'rejected-1', status: 'rejected' }),
    ];

    expect(computeVerifierMetrics([], history)).toMatchObject({
      approvalRate: 67,
      totalResolved: 3,
      approvedResolved: 2,
      rejectedResolved: 1,
    });
  });

  it('counts urgent and overdue pending threshold boundaries', () => {
    const pending = [
      task({ id: 'overdue', daysRemaining: -1 }),
      task({ id: 'due-today', daysRemaining: 0 }),
      task({ id: 'urgent', daysRemaining: 3 }),
      task({ id: 'normal', daysRemaining: 4 }),
    ];

    expect(computeVerifierMetrics(pending, [])).toMatchObject({
      urgentPending: 3,
      overduePending: 2,
    });
  });
});
