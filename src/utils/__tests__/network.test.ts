import { describe, expect, it } from 'vitest';
import { getExpectedNetwork, isNetworkMismatch, parseExpectedNetwork } from '../network';

describe('network helpers', () => {
  it('parses expected network values and defaults invalid values to TESTNET', () => {
    expect(parseExpectedNetwork('PUBLIC')).toBe('PUBLIC');
    expect(parseExpectedNetwork(' public ')).toBe('PUBLIC');
    expect(parseExpectedNetwork('TESTNET')).toBe('TESTNET');
    expect(parseExpectedNetwork('invalid')).toBe('TESTNET');
    expect(parseExpectedNetwork(undefined)).toBe('TESTNET');
  });

  it('reads the expected network from an explicit env value', () => {
    expect(getExpectedNetwork('PUBLIC')).toBe('PUBLIC');
    expect(getExpectedNetwork('')).toBe('TESTNET');
  });

  it('detects connected-wallet network mismatches', () => {
    expect(isNetworkMismatch('PUBLIC', 'TESTNET')).toBe(true);
    expect(isNetworkMismatch('TESTNET', 'TESTNET')).toBe(false);
    expect(isNetworkMismatch(null, 'TESTNET')).toBe(false);
  });
});
