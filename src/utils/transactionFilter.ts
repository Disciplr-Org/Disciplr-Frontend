export type TransactionType = 'create' | 'validate' | 'release' | 'redirect';
export type TransactionStatus = 'confirmed' | 'pending' | 'failed';

export interface FilterableTransaction {
  type: TransactionType;
  status: TransactionStatus;
  timestamp: Date | string | number;
}

export interface TransactionFilters {
  type: TransactionType | 'all';
  status: TransactionStatus | 'all';
  startDate?: string;
  endDate?: string;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateBound(value: string | undefined, bound: 'start' | 'end'): Date | null {
  if (!value?.trim()) return null;

  const match = DATE_ONLY_PATTERN.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date =
    bound === 'start'
      ? new Date(year, month, day, 0, 0, 0, 0)
      : new Date(year, month, day, 23, 59, 59, 999);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function toValidDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function filterTransactions<T extends FilterableTransaction>(
  transactions: T[],
  { type, status, startDate, endDate }: TransactionFilters,
): T[] {
  const start = parseDateBound(startDate, 'start');
  const end = parseDateBound(endDate, 'end');

  if (start && end && start.getTime() > end.getTime()) {
    return [];
  }

  return transactions.filter((transaction) => {
    if (type !== 'all' && transaction.type !== type) return false;
    if (status !== 'all' && transaction.status !== status) return false;

    const timestamp = toValidDate(transaction.timestamp);
    if (!timestamp) return false;
    if (start && timestamp.getTime() < start.getTime()) return false;
    if (end && timestamp.getTime() > end.getTime()) return false;

    return true;
  });
}
