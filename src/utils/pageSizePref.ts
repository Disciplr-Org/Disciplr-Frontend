export const VALIDATION_HISTORY_PAGE_SIZE_KEY = 'validation-history-page-size';
export const VALIDATION_HISTORY_PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_VALIDATION_HISTORY_PAGE_SIZE = 10;

export type ValidationHistoryPageSize = (typeof VALIDATION_HISTORY_PAGE_SIZES)[number];

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const getStorage = (): StorageLike | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export function isValidationHistoryPageSize(
  value: number,
): value is ValidationHistoryPageSize {
  return VALIDATION_HISTORY_PAGE_SIZES.includes(value as ValidationHistoryPageSize);
}

export function coerceValidationHistoryPageSize(value: unknown): ValidationHistoryPageSize {
  const numericValue = Number(value);
  return isValidationHistoryPageSize(numericValue)
    ? numericValue
    : DEFAULT_VALIDATION_HISTORY_PAGE_SIZE;
}

export function readValidationHistoryPageSize(
  storage: StorageLike | undefined = getStorage(),
): ValidationHistoryPageSize {
  if (!storage) return DEFAULT_VALIDATION_HISTORY_PAGE_SIZE;

  try {
    return coerceValidationHistoryPageSize(storage.getItem(VALIDATION_HISTORY_PAGE_SIZE_KEY));
  } catch {
    return DEFAULT_VALIDATION_HISTORY_PAGE_SIZE;
  }
}

export function writeValidationHistoryPageSize(
  pageSize: ValidationHistoryPageSize,
  storage: StorageLike | undefined = getStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(VALIDATION_HISTORY_PAGE_SIZE_KEY, String(pageSize));
  } catch {
    // Storage can fail in private browsing or locked-down environments.
  }
}
