/**
 * Unit tests for the scalar validators and lookupVaultSafe in vaultState.ts.
 *
 * Scope: isValidVaultRouteId, lookupVaultSafe, isPlausibleStellarAddress,
 *        isValidTxHash, isFiniteAmount, isPositiveAmount, isValidCurrency.
 *
 * Out of scope: validateVaultResponse, analyzeMilestones,
 *               detectSettlementAnomalies, evalVaultActionAuth.
 */

import { describe, it, expect, vi } from 'vitest';

// vaultState imports services that touch Zustand / env vars.
// Mock them before the module under test is imported so the pure-logic
// validators are exercised without any runtime side effects.
vi.mock('../../services/api', () => ({ isApiEnabled: () => false }));
vi.mock('../../services/connectivity', () => ({
  useConnectivityStore: { getState: () => ({ status: 'online' }) },
}));
vi.mock('../../utils/networkMismatch', () => ({ isNetworkMismatch: () => false }));
vi.mock('../../utils/stellarAddress', () => ({
  isValidStellarAddress: (v: unknown) =>
    typeof v === 'string' && v.length === 56 && /^[GC][A-Z2-7]+$/.test(v),
}));

import {
  isValidVaultRouteId,
  lookupVaultSafe,
  isPlausibleStellarAddress,
  isValidTxHash,
  isFiniteAmount,
  isPositiveAmount,
  isValidCurrency,
} from '../vaultState';

import {
  ACCOUNT_A,
  ACCOUNT_B,
  CONTRACT_ADDRESS,
} from '../../__tests__/fixtures/stellarAddresses';

// ── isValidVaultRouteId ──────────────────────────────────────────────────────��

describe('isValidVaultRouteId', () => {
  it.each([
    ['simple alpha',          'abc'],
    ['digits',                '123'],
    ['underscore and hyphen', 'abc_123-XYZ'],
    ['single char',           'a'],
    ['exactly 64 chars',      'a'.repeat(64)],
  ])('accepts %s', (_label, id) => {
    expect(isValidVaultRouteId(id)).toBe(true);
  });

  it.each([
    ['empty string',       ''],
    ['65 chars',           'a'.repeat(65)],
    ['space inside',       'a b'],
    ['path traversal',     '../x'],
    ['dot only',           '.'],
    ['at sign',            'abc@def'],
    ['__proto__',          '__proto__'],
    ['constructor',        'constructor'],
    ['prototype',          'prototype'],
    ['hasOwnProperty',     'hasOwnProperty'],
    ['toString',           'toString'],
    ['number input',       42 as unknown as string],
    ['null',               null as unknown as string],
    ['undefined',          undefined as unknown as string],
    ['object',             {} as unknown as string],
  ])('rejects %s', (_label, id) => {
    expect(isValidVaultRouteId(id)).toBe(false);
  });
});

// ── lookupVaultSafe ───────────────────────────────────────────────────────────

describe('lookupVaultSafe', () => {
  const store = { abc: 'value-abc', xyz: 'value-xyz' };

  it('returns the value for a present own key', () => {
    expect(lookupVaultSafe(store, 'abc')).toBe('value-abc');
  });

  it('returns the value for a second own key', () => {
    expect(lookupVaultSafe(store, 'xyz')).toBe('value-xyz');
  });

  it('returns undefined for an absent key', () => {
    expect(lookupVaultSafe(store, 'missing')).toBeUndefined();
  });

  it('returns undefined when id is undefined', () => {
    expect(lookupVaultSafe(store, undefined)).toBeUndefined();
  });

  it.each([
    '__proto__',
    'constructor',
    'prototype',
    'hasOwnProperty',
    'toString',
  ])('returns undefined for prototype key "%s"', (key) => {
    // Even if the caller somehow plants the key, the guard fires first.
    const poisoned = Object.create(null) as Record<string, string>;
    poisoned[key] = 'injected';
    expect(lookupVaultSafe(store, key)).toBeUndefined();
    expect(lookupVaultSafe(poisoned, key)).toBeUndefined();
  });
});

// ── isPlausibleStellarAddress ─────────────────────────────────────────────────

describe('isPlausibleStellarAddress', () => {
  // Build a valid-looking address of an arbitrary length from fixture data.
  // ACCOUNT_A is 56 chars; we slice/pad within the 40-72 range for edge tests.
  const base = ACCOUNT_A; // 56 chars — well within range, starts with G

  it.each([
    ['ACCOUNT_A (56 chars)',         ACCOUNT_A],
    ['ACCOUNT_B (55 chars)',         ACCOUNT_B],
    ['CONTRACT_ADDRESS (C prefix)',  CONTRACT_ADDRESS],
    ['G + 55 base32 chars (56 total)', 'G' + 'A'.repeat(55)],
    ['min length 40',                'G' + 'A'.repeat(39)],
    ['max length 72',                'G' + 'A'.repeat(71)],
  ])('accepts %s', (_label, addr) => {
    expect(isPlausibleStellarAddress(addr)).toBe(true);
  });

  it.each([
    ['39 chars (too short)',   'G' + 'A'.repeat(38)],
    ['73 chars (too long)',    'G' + 'A'.repeat(72)],
    ['lowercase g prefix',    'g' + base.slice(1)],
    ['lowercase body',        'G' + base.slice(1).toLowerCase()],
    ['D prefix',              'D' + base.slice(1)],
    ['contains digit 1',      'G' + '1'.repeat(55)],  // 1 is not in base32
    ['empty string',          ''],
    ['number',                56 as unknown as string],
    ['null',                  null as unknown as string],
  ])('rejects %s', (_label, addr) => {
    expect(isPlausibleStellarAddress(addr)).toBe(false);
  });
});

// ── isValidTxHash ─────────────────────────────────────────────────────────────

describe('isValidTxHash', () => {
  it.each([
    ['exactly 8 chars',  'abcd1234'],
    ['exactly 64 chars', 'a'.repeat(64)],
    ['mixed case alpha', 'AbCdEfGh'],
    ['hex-style',        'deadbeef12345678'],
    ['uppercase',        'ABCDEF1234567890'],
  ])('accepts %s', (_label, hash) => {
    expect(isValidTxHash(hash)).toBe(true);
  });

  it.each([
    ['7 chars (too short)',  'abcdef1'],
    ['65 chars (too long)',  'a'.repeat(65)],
    ['contains slash',       'abc/defg'],
    ['contains dot',         'abc.defg'],
    ['contains hyphen',      'abc-defg'],
    ['contains space',       'abc defg'],
    ['empty string',         ''],
    ['null',                 null as unknown as string],
  ])('rejects %s', (_label, hash) => {
    expect(isValidTxHash(hash)).toBe(false);
  });
});

// ── isFiniteAmount ────────────────────────────────────────────────────────────

describe('isFiniteAmount', () => {
  it.each([
    ['zero',         0],
    ['positive int', 100],
    ['positive float', 0.001],
  ])('accepts %s', (_label, v) => {
    expect(isFiniteAmount(v)).toBe(true);
  });

  it.each([
    ['negative',    -1],
    ['Infinity',    Infinity],
    ['-Infinity',   -Infinity],
    ['NaN',         NaN],
    ['string',      '5' as unknown as number],
    ['null',        null as unknown as number],
  ])('rejects %s', (_label, v) => {
    expect(isFiniteAmount(v)).toBe(false);
  });
});

// ── isPositiveAmount ──────────────────────────────────────────────────────────

describe('isPositiveAmount', () => {
  it.each([
    ['1',      1],
    ['0.001',  0.001],
    ['1e6',    1_000_000],
  ])('accepts %s', (_label, v) => {
    expect(isPositiveAmount(v)).toBe(true);
  });

  it.each([
    ['zero',      0],
    ['negative',  -0.01],
    ['Infinity',  Infinity],
    ['NaN',       NaN],
    ['string',    '1' as unknown as number],
    ['null',      null as unknown as number],
  ])('rejects %s', (_label, v) => {
    expect(isPositiveAmount(v)).toBe(false);
  });
});

// ── isValidCurrency ───────────────────────────────────────────────────────────

describe('isValidCurrency', () => {
  it.each([
    ['USDC',          'USDC'],
    ['XLM',           'XLM'],
    ['ab (min 2)',     'ab'],
    ['ABCDEFGHIJKL',  'ABCDEFGHIJKL'], // 12 chars
    ['lowercase ok',  'usdc'],
  ])('accepts %s', (_label, v) => {
    expect(isValidCurrency(v)).toBe(true);
  });

  it.each([
    ['single char',        'A'],
    ['13 chars',           'A'.repeat(13)],
    ['contains dollar',    'US$'],
    ['contains digit',     'US1C'],
    ['contains space',     'US DC'],
    ['empty string',       ''],
    ['number',             42 as unknown as string],
    ['null',               null as unknown as string],
  ])('rejects %s', (_label, v) => {
    expect(isValidCurrency(v)).toBe(false);
  });
});
