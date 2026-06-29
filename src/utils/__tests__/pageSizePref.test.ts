import { describe, expect, it, vi } from 'vitest';
import {
  coerceValidationHistoryPageSize,
  DEFAULT_VALIDATION_HISTORY_PAGE_SIZE,
  readValidationHistoryPageSize,
  VALIDATION_HISTORY_PAGE_SIZE_KEY,
  VALIDATION_HISTORY_PAGE_SIZES,
  writeValidationHistoryPageSize,
} from '../pageSizePref';

const storage = (initialValue: string | null = null) => ({
  getItem: vi.fn(() => initialValue),
  setItem: vi.fn(),
});

describe('pageSizePref', () => {
  it('exports the supported validation history page sizes', () => {
    expect(VALIDATION_HISTORY_PAGE_SIZES).toEqual([10, 25, 50]);
  });

  it('coerces invalid values to the default page size', () => {
    expect(coerceValidationHistoryPageSize(10)).toBe(10);
    expect(coerceValidationHistoryPageSize('25')).toBe(25);
    expect(coerceValidationHistoryPageSize(5)).toBe(DEFAULT_VALIDATION_HISTORY_PAGE_SIZE);
    expect(coerceValidationHistoryPageSize('not-a-size')).toBe(DEFAULT_VALIDATION_HISTORY_PAGE_SIZE);
  });

  it('reads a valid stored page size', () => {
    expect(readValidationHistoryPageSize(storage('50'))).toBe(50);
  });

  it('falls back when storage has an invalid value', () => {
    expect(readValidationHistoryPageSize(storage('5'))).toBe(DEFAULT_VALIDATION_HISTORY_PAGE_SIZE);
  });

  it('falls back when storage reads throw', () => {
    const blockedStorage = {
      getItem: vi.fn(() => {
        throw new Error('storage blocked');
      }),
      setItem: vi.fn(),
    };

    expect(readValidationHistoryPageSize(blockedStorage)).toBe(DEFAULT_VALIDATION_HISTORY_PAGE_SIZE);
  });

  it('writes a supported page size', () => {
    const writableStorage = storage();

    writeValidationHistoryPageSize(25, writableStorage);

    expect(writableStorage.setItem).toHaveBeenCalledWith(VALIDATION_HISTORY_PAGE_SIZE_KEY, '25');
  });

  it('ignores storage write failures', () => {
    const blockedStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error('storage blocked');
      }),
    };

    expect(() => writeValidationHistoryPageSize(50, blockedStorage)).not.toThrow();
  });
});
