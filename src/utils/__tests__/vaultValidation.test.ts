import { describe, expect, it } from 'vitest';
import {
  exceedsBalance,
  isFutureDeadline,
  isValidStellarAddress,
  isValidUsdcAmount,
  validateCreateVault,
} from '../vaultValidation';

const successAddress = `G${'A'.repeat(55)}`;
const failureAddress = `G${'B'.repeat(55)}`;
const now = new Date('2026-06-18T00:00:00Z');

describe('vaultValidation', () => {
  it('validates positive USDC amounts with up to 7 decimals', () => {
    expect(isValidUsdcAmount('1')).toBe(true);
    expect(isValidUsdcAmount('0.0000001')).toBe(true);
    expect(isValidUsdcAmount('0')).toBe(false);
    expect(isValidUsdcAmount('-1')).toBe(false);
    expect(isValidUsdcAmount('1.12345678')).toBe(false);
    expect(isValidUsdcAmount('1e3')).toBe(false);
  });

  it('validates Stellar public key shape', () => {
    expect(isValidStellarAddress(successAddress)).toBe(true);
    expect(isValidStellarAddress(` ${successAddress} `)).toBe(true);
    expect(isValidStellarAddress(`M${'A'.repeat(55)}`)).toBe(false);
    expect(isValidStellarAddress(`G${'A'.repeat(54)}`)).toBe(false);
    expect(isValidStellarAddress(`G${'0'.repeat(55)}`)).toBe(false);
  });

  it('requires a valid future deadline', () => {
    expect(isFutureDeadline('2026-06-18T00:00:01Z', now)).toBe(true);
    expect(isFutureDeadline('2026-06-18T00:00:00Z', now)).toBe(false);
    expect(isFutureDeadline('not-a-date', now)).toBe(false);
  });

  it('returns field-specific errors for invalid create-vault values', () => {
    const errors = validateCreateVault(
      {
        amount: '1.12345678',
        deadline: '2020-01-01T00:00:00Z',
        successAddress: 'bad',
        failureAddress: 'bad',
      },
      now,
    );

    expect(errors).toEqual({
      amount: 'Enter a positive USDC amount with up to 7 decimal places.',
      deadline: 'Choose a future deadline.',
      successAddress: 'Enter a valid Stellar public key starting with G.',
      failureAddress: 'Enter a valid Stellar public key starting with G.',
    });
  });

  it('rejects identical success and failure destinations', () => {
    const errors = validateCreateVault(
      {
        amount: '100',
        deadline: '2026-06-19T00:00:00Z',
        successAddress,
        failureAddress: successAddress,
      },
      now,
    );

    expect(errors).toEqual({
      failureAddress: 'Failure destination must be different from success destination.',
    });
  });

  it('returns no errors for valid create-vault values', () => {
    expect(
      validateCreateVault(
        {
          amount: '100.1234567',
          deadline: '2026-06-19T00:00:00Z',
          successAddress,
          failureAddress,
        },
        now,
      ),
    ).toEqual({});
  });
});

describe('exceedsBalance', () => {
  it('returns true when amount is greater than balance', () => {
    expect(exceedsBalance('200', '100')).toBe(true);
  });

  it('returns false when amount equals balance', () => {
    expect(exceedsBalance('100', '100')).toBe(false);
  });

  it('returns false when amount is less than balance', () => {
    expect(exceedsBalance('50', '100')).toBe(false);
  });

  it('returns false when balance is null (unknown)', () => {
    expect(exceedsBalance('100', null)).toBe(false);
  });

  it('returns false when amount is not a finite number', () => {
    expect(exceedsBalance('abc', '100')).toBe(false);
  });

  it('returns false when balance is not a finite number', () => {
    expect(exceedsBalance('100', 'abc')).toBe(false);
  });

  it('handles decimal amounts correctly', () => {
    expect(exceedsBalance('100.01', '100')).toBe(true);
    expect(exceedsBalance('99.99', '100')).toBe(false);
  });
});
