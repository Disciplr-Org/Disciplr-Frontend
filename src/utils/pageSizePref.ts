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

export const NOTIFICATION_PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

export type NotificationPageSize = (typeof NOTIFICATION_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_NOTIFICATION_PAGE_SIZE: NotificationPageSize =
  NOTIFICATION_PAGE_SIZE_OPTIONS[0];

export const NOTIFICATION_PAGE_SIZE_STORAGE_KEY = 'notification-page-size';

export function isNotificationPageSize(value: number): value is NotificationPageSize {
  return NOTIFICATION_PAGE_SIZE_OPTIONS.includes(value as NotificationPageSize);
}

export function readNotificationPageSize(): NotificationPageSize {
  const storage = getLocalStorage();

  if (!storage) {
    return DEFAULT_NOTIFICATION_PAGE_SIZE;
  }

  try {
    const stored =
      storage.getItem(NOTIFICATION_PAGE_SIZE_STORAGE_KEY) ??
      storage.getItem('notifications-page-size');
    const parsed = stored ? Number(stored) : DEFAULT_NOTIFICATION_PAGE_SIZE;

    return isNotificationPageSize(parsed)
      ? parsed
      : DEFAULT_NOTIFICATION_PAGE_SIZE;
  } catch {
    return DEFAULT_NOTIFICATION_PAGE_SIZE;
  }
}

export function persistNotificationPageSize(size: number): NotificationPageSize {
  const nextSize = isNotificationPageSize(size)
    ? size
    : DEFAULT_NOTIFICATION_PAGE_SIZE;
  const storage = getLocalStorage();

  if (!storage) {
    return nextSize;
  }

  try {
    storage.setItem(NOTIFICATION_PAGE_SIZE_STORAGE_KEY, String(nextSize));
  } catch {
    // A blocked storage write should not break pagination.
  }

  return nextSize;
}

export const TRANSACTIONS_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export type TransactionsPageSize = (typeof TRANSACTIONS_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_TRANSACTIONS_PAGE_SIZE: TransactionsPageSize =
  TRANSACTIONS_PAGE_SIZE_OPTIONS[0];

export const TRANSACTIONS_PAGE_SIZE_STORAGE_KEY = 'transactions-page-size';

export function isTransactionsPageSize(value: number): value is TransactionsPageSize {
  return TRANSACTIONS_PAGE_SIZE_OPTIONS.includes(value as TransactionsPageSize);
}

export function readTransactionsPageSize(): TransactionsPageSize {
  const storage = getLocalStorage();

  if (!storage) {
    return DEFAULT_TRANSACTIONS_PAGE_SIZE;
  }

  try {
    const stored = storage.getItem(TRANSACTIONS_PAGE_SIZE_STORAGE_KEY);
    const parsed = stored ? Number(stored) : DEFAULT_TRANSACTIONS_PAGE_SIZE;

    return isTransactionsPageSize(parsed)
      ? parsed
      : DEFAULT_TRANSACTIONS_PAGE_SIZE;
  } catch {
    return DEFAULT_TRANSACTIONS_PAGE_SIZE;
  }
}

export function persistTransactionsPageSize(size: number): TransactionsPageSize {
  const nextSize = isTransactionsPageSize(size)
    ? size
    : DEFAULT_TRANSACTIONS_PAGE_SIZE;
  const storage = getLocalStorage();

  if (!storage) {
    return nextSize;
  }

  try {
    storage.setItem(TRANSACTIONS_PAGE_SIZE_STORAGE_KEY, String(nextSize));
  } catch {
    // A blocked storage write should not break pagination.
  }

  return nextSize;
}
