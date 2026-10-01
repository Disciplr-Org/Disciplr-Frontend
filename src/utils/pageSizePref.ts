export const VALIDATION_HISTORY_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export type ValidationHistoryPageSize = (typeof VALIDATION_HISTORY_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_VALIDATION_HISTORY_PAGE_SIZE: ValidationHistoryPageSize =
  VALIDATION_HISTORY_PAGE_SIZE_OPTIONS[0];

export const VALIDATION_HISTORY_PAGE_SIZE_STORAGE_KEY = 'validation-history-page-size';

export function isValidationHistoryPageSize(value: number): value is ValidationHistoryPageSize {
  return VALIDATION_HISTORY_PAGE_SIZE_OPTIONS.includes(value as ValidationHistoryPageSize);
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readValidationHistoryPageSize(): ValidationHistoryPageSize {
  const storage = getLocalStorage();

  if (!storage) {
    return DEFAULT_VALIDATION_HISTORY_PAGE_SIZE;
  }

  try {
    const stored = storage.getItem(VALIDATION_HISTORY_PAGE_SIZE_STORAGE_KEY);
    const parsed = stored ? Number(stored) : DEFAULT_VALIDATION_HISTORY_PAGE_SIZE;

    return isValidationHistoryPageSize(parsed)
      ? parsed
      : DEFAULT_VALIDATION_HISTORY_PAGE_SIZE;
  } catch {
    return DEFAULT_VALIDATION_HISTORY_PAGE_SIZE;
  }
}

export function persistValidationHistoryPageSize(size: number): ValidationHistoryPageSize {
  const nextSize = isValidationHistoryPageSize(size)
    ? size
    : DEFAULT_VALIDATION_HISTORY_PAGE_SIZE;
  const storage = getLocalStorage();

  if (!storage) {
    return nextSize;
  }

  try {
    storage.setItem(VALIDATION_HISTORY_PAGE_SIZE_STORAGE_KEY, String(nextSize));
  } catch {
    // A blocked storage write should not break pagination.
  }

  return nextSize;
}
