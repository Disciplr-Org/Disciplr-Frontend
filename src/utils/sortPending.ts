import type { ValidationTask } from '../Zustand/Store';

export type PendingSortKey = 'deadline' | 'amount' | 'vaultName';
export type SortDirection = 'asc' | 'desc';

const parseAmount = (amount: string): number => {
  const match = amount.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const parseDeadline = (task: ValidationTask): number => {
  const timestamp = Date.parse(task.deadline);
  return Number.isNaN(timestamp) ? task.daysRemaining : timestamp;
};

const compareTasks = (
  a: ValidationTask,
  b: ValidationTask,
  key: PendingSortKey,
): number => {
  switch (key) {
    case 'amount':
      return parseAmount(a.amount) - parseAmount(b.amount);
    case 'vaultName':
      return a.vaultName.localeCompare(b.vaultName, undefined, {
        sensitivity: 'base',
        numeric: true,
      });
    case 'deadline':
    default:
      return parseDeadline(a) - parseDeadline(b);
  }
};

export function sortPending(
  tasks: ValidationTask[],
  key: PendingSortKey,
  dir: SortDirection,
): ValidationTask[] {
  const direction = dir === 'desc' ? -1 : 1;

  return tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const compared = compareTasks(a.task, b.task, key);
      return compared === 0 ? a.index - b.index : compared * direction;
    })
    .map(({ task }) => task);
}
