import { describe, expect, it } from 'vitest';
import type { ValidationTask } from '../../Zustand/Store';
import { sortPending } from '../sortPending';

const task = (
  id: string,
  overrides: Partial<ValidationTask> = {},
): ValidationTask => ({
  id,
  vaultName: `Vault ${id}`,
  owner: '0xowner',
  amount: '1,000 USDC',
  deadline: '2026-07-01',
  daysRemaining: 10,
  status: 'pending',
  milestone: 'Milestone',
  ...overrides,
});

describe('sortPending', () => {
  it('sorts deadlines ascending and descending', () => {
    const tasks = [
      task('later', { deadline: '2026-08-01', daysRemaining: 40 }),
      task('soon', { deadline: '2026-06-20', daysRemaining: 2 }),
      task('middle', { deadline: '2026-07-01', daysRemaining: 10 }),
    ];

    expect(sortPending(tasks, 'deadline', 'asc').map((t) => t.id)).toEqual([
      'soon',
      'middle',
      'later',
    ]);
    expect(sortPending(tasks, 'deadline', 'desc').map((t) => t.id)).toEqual([
      'later',
      'middle',
      'soon',
    ]);
  });

  it('parses numeric amounts with separators', () => {
    const tasks = [
      task('small', { amount: '500 USDC' }),
      task('large', { amount: '20,000 USDC' }),
      task('middle', { amount: '$1,250.50' }),
    ];

    expect(sortPending(tasks, 'amount', 'desc').map((t) => t.id)).toEqual([
      'large',
      'middle',
      'small',
    ]);
  });

  it('sorts vault names case-insensitively', () => {
    const tasks = [
      task('c', { vaultName: 'zeta Vault' }),
      task('a', { vaultName: 'Alpha Vault' }),
      task('b', { vaultName: 'beta Vault' }),
    ];

    expect(sortPending(tasks, 'vaultName', 'asc').map((t) => t.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('preserves relative order for equal keys', () => {
    const tasks = [
      task('first', { amount: 'not available' }),
      task('second', { amount: 'pending' }),
      task('third', { amount: 'unknown' }),
    ];

    expect(sortPending(tasks, 'amount', 'asc').map((t) => t.id)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('handles empty lists', () => {
    expect(sortPending([], 'deadline', 'asc')).toEqual([]);
  });
});
