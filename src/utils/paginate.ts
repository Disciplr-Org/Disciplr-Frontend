import type { ValidationTask } from '../Zustand/Store';

export type ValidationHistoryStatusFilter = 'all' | 'approved' | 'rejected';

export interface FilterValidationHistoryArgs {
  status: ValidationHistoryStatusFilter;
  search: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageCount: number;
  pageSize: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export function filterValidationHistory(
  tasks: ValidationTask[],
  { status, search }: FilterValidationHistoryArgs,
): ValidationTask[] {
  const normalizedSearch = search.trim().toLowerCase();

  return tasks.filter((task) => {
    const statusMatches = status === 'all' || task.status === status;
    const searchMatches =
      normalizedSearch.length === 0 ||
      [task.vaultName, task.owner].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );

    return statusMatches && searchMatches;
  });
}

export function paginateCollection<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const safePageSize = Math.max(1, Math.floor(pageSize) || 1);
  const totalItems = items.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / safePageSize));
  const normalizedPage = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const startIndex = (normalizedPage - 1) * safePageSize;
  const endIndex = Math.min(startIndex + safePageSize, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    page: normalizedPage,
    pageCount,
    pageSize: safePageSize,
    totalItems,
    startIndex,
    endIndex,
  };
}
