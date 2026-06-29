import { describe, expect, it } from 'vitest';
import { sortPending } from '../sortPending';
import type { ValidationTask } from '../../Zustand/Store';

const task = (overrides: Partial<ValidationTask>): ValidationTask => ({
  id: 'task',
  vaultName: 'Vault',
  owner: '0xowner',
  amount: '1,000 USDC',
  deadline: '2026-07-01',
  daysRemaining: 10,
  status: 'pending',
  milestone: 'Phase 1',
  ...overrides,
});

const ids = (tasks: ValidationTask[]) => tasks.map((item) => item.id);

describe('sortPending', () => {
  it('sorts by deadline ascending and descending', () => {
    const tasks = [
      task({ id: 'late', deadline: '2026-08-01', daysRemaining: 40 }),
      task({ id: 'early', deadline: '2026-06-20', daysRemaining: 1 }),
      task({ id: 'middle', deadline: '2026-07-01', daysRemaining: 10 }),
    ];

    expect(ids(sortPending(tasks, 'deadline', 'asc'))).toEqual(['early', 'middle', 'late']);
    expect(ids(sortPending(tasks, 'deadline', 'desc'))).toEqual(['late', 'middle', 'early']);
  });

  it('sorts amount strings numerically', () => {
    const tasks = [
      task({ id: 'large', amount: '20,000 USDC' }),
      task({ id: 'small', amount: '750 USDC' }),
      task({ id: 'medium', amount: '5,000 USDC' }),
    ];

    expect(ids(sortPending(tasks, 'amount', 'asc'))).toEqual(['small', 'medium', 'large']);
  });

  it('sorts vault names without case sensitivity', () => {
    const tasks = [
      task({ id: 'gamma', vaultName: 'gamma vault' }),
      task({ id: 'alpha', vaultName: 'Alpha Vault' }),
      task({ id: 'beta', vaultName: 'Beta Vault' }),
    ];

    expect(ids(sortPending(tasks, 'vaultName', 'asc'))).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('keeps equal values in their original relative order', () => {
    const tasks = [
      task({ id: 'first', amount: '1,000 USDC' }),
      task({ id: 'second', amount: '1,000 USDC' }),
      task({ id: 'third', amount: '2,000 USDC' }),
    ];

    expect(ids(sortPending(tasks, 'amount', 'asc'))).toEqual(['first', 'second', 'third']);
  });

  it('does not mutate the input array', () => {
    const tasks = [
      task({ id: 'b', vaultName: 'Beta Vault' }),
      task({ id: 'a', vaultName: 'Alpha Vault' }),
    ];

    const sorted = sortPending(tasks, 'vaultName', 'asc');

    expect(ids(sorted)).toEqual(['a', 'b']);
    expect(ids(tasks)).toEqual(['b', 'a']);
  });
});
