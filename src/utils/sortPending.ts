import type { ValidationTask } from '../Zustand/Store';

export type PendingSortKey = 'deadline' | 'amount' | 'vaultName';
export type PendingSortDirection = 'asc' | 'desc';

type PendingTask = ValidationTask;

const parseAmount = (amount: string): number => {
  const parsed = Number.parseFloat(amount.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDeadline = (task: PendingTask): number => {
  const parsed = Date.parse(task.deadline);
  return Number.isFinite(parsed) ? parsed : task.daysRemaining;
};

const compareTasks = (a: PendingTask, b: PendingTask, key: PendingSortKey): number => {
  if (key === 'amount') {
    return parseAmount(a.amount) - parseAmount(b.amount);
  }

  if (key === 'vaultName') {
    return a.vaultName.localeCompare(b.vaultName, undefined, { sensitivity: 'base' });
  }

  return parseDeadline(a) - parseDeadline(b);
};

export function sortPending(
  tasks: PendingTask[],
  key: PendingSortKey,
  direction: PendingSortDirection,
): PendingTask[] {
  const multiplier = direction === 'asc' ? 1 : -1;

  return tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const result = compareTasks(a.task, b.task, key) * multiplier;
      return result === 0 ? a.index - b.index : result;
    })
    .map(({ task }) => task);
}
