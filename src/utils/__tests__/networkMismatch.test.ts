import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EXPECTED_NETWORK,
  isNetworkMismatch,
  resolveExpectedNetwork,
} from '../networkMismatch';

describe('resolveExpectedNetwork', () => {
  it('keeps supported expected network values', () => {
    expect(resolveExpectedNetwork('TESTNET')).toBe('TESTNET');
    expect(resolveExpectedNetwork('PUBLIC')).toBe('PUBLIC');
  });

  it('falls back to TESTNET for missing or unsupported config values', () => {
    expect(resolveExpectedNetwork(undefined)).toBe(DEFAULT_EXPECTED_NETWORK);
    expect(resolveExpectedNetwork(null)).toBe(DEFAULT_EXPECTED_NETWORK);
    expect(resolveExpectedNetwork('FUTURENET')).toBe(DEFAULT_EXPECTED_NETWORK);
  });
});

describe('isNetworkMismatch', () => {
  it('returns false when the wallet network matches the expected app network', () => {
    expect(isNetworkMismatch('TESTNET', 'TESTNET')).toBe(false);
    expect(isNetworkMismatch('PUBLIC', 'PUBLIC')).toBe(false);
  });

  it('returns true when the wallet network differs from the expected app network', () => {
    expect(isNetworkMismatch('PUBLIC', 'TESTNET')).toBe(true);
    expect(isNetworkMismatch('TESTNET', 'PUBLIC')).toBe(true);
  });

  it('does not warn while the wallet is disconnected or still loading network state', () => {
    expect(isNetworkMismatch(null, 'TESTNET')).toBe(false);
    expect(isNetworkMismatch(undefined, 'PUBLIC')).toBe(false);
  });

  it('treats unsupported connected wallet network values as mismatches', () => {
    expect(isNetworkMismatch('FUTURENET', 'TESTNET')).toBe(true);
    expect(isNetworkMismatch('CUSTOM', 'PUBLIC')).toBe(true);
  });
});
