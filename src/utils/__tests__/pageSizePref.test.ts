// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_VALIDATION_HISTORY_PAGE_SIZE,
  VALIDATION_HISTORY_PAGE_SIZE_OPTIONS,
  VALIDATION_HISTORY_PAGE_SIZE_STORAGE_KEY,
  isValidationHistoryPageSize,
  persistValidationHistoryPageSize,
  readValidationHistoryPageSize,
} from '../pageSizePref';

describe('pageSizePref', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('accepts only supported validation history page sizes', () => {
    expect(VALIDATION_HISTORY_PAGE_SIZE_OPTIONS).toEqual([10, 25, 50]);
    expect(isValidationHistoryPageSize(10)).toBe(true);
    expect(isValidationHistoryPageSize(25)).toBe(true);
    expect(isValidationHistoryPageSize(50)).toBe(true);
    expect(isValidationHistoryPageSize(5)).toBe(false);
  });

  it('reads the default size when storage is empty', () => {
    expect(readValidationHistoryPageSize()).toBe(DEFAULT_VALIDATION_HISTORY_PAGE_SIZE);
  });

  it('reads a valid stored page size', () => {
    window.localStorage.setItem(VALIDATION_HISTORY_PAGE_SIZE_STORAGE_KEY, '25');

    expect(readValidationHistoryPageSize()).toBe(25);
  });

  it('falls back to the default for invalid stored values', () => {
    window.localStorage.setItem(VALIDATION_HISTORY_PAGE_SIZE_STORAGE_KEY, '999');

    expect(readValidationHistoryPageSize()).toBe(DEFAULT_VALIDATION_HISTORY_PAGE_SIZE);
  });

  it('persists valid page sizes', () => {
    expect(persistValidationHistoryPageSize(50)).toBe(50);
    expect(window.localStorage.getItem(VALIDATION_HISTORY_PAGE_SIZE_STORAGE_KEY)).toBe('50');
  });

  it('normalizes invalid persisted values to the default', () => {
    expect(persistValidationHistoryPageSize(7)).toBe(DEFAULT_VALIDATION_HISTORY_PAGE_SIZE);
    expect(window.localStorage.getItem(VALIDATION_HISTORY_PAGE_SIZE_STORAGE_KEY)).toBe('10');
  });

  it('handles storage read failures', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(readValidationHistoryPageSize()).toBe(DEFAULT_VALIDATION_HISTORY_PAGE_SIZE);
  });

  it('handles storage write failures', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(persistValidationHistoryPageSize(25)).toBe(25);
  });
});
