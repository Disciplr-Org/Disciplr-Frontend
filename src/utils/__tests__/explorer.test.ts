import { describe, it, expect } from 'vitest';
import { contractExplorerUrl, networkLabel } from '../explorer';

const TESTNET_BASE = 'https://stellar.expert/explorer/testnet';
const PUBLIC_BASE = 'https://stellar.expert/explorer/public';
const ADDR = 'GCONT3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK';

describe('contractExplorerUrl', () => {
  it('builds a testnet contract URL for TESTNET', () => {
    expect(contractExplorerUrl(ADDR, 'TESTNET')).toBe(
      `${TESTNET_BASE}/contract/${ADDR}`,
    );
  });

  it('builds a public contract URL for PUBLIC', () => {
    expect(contractExplorerUrl(ADDR, 'PUBLIC')).toBe(
      `${PUBLIC_BASE}/contract/${ADDR}`,
    );
  });

  it('falls back to testnet for an unknown network string', () => {
    expect(contractExplorerUrl(ADDR, 'UNKNOWN')).toBe(
      `${TESTNET_BASE}/contract/${ADDR}`,
    );
  });

  it('returns an empty string when address is empty', () => {
    expect(contractExplorerUrl('', 'TESTNET')).toBe('');
  });

  it('URL contains the exact address passed in', () => {
    const url = contractExplorerUrl(ADDR, 'PUBLIC');
    expect(url).toContain(ADDR);
  });

  it('testnet and public URLs differ only by the network segment', () => {
    const testnet = contractExplorerUrl(ADDR, 'TESTNET');
    const pub = contractExplorerUrl(ADDR, 'PUBLIC');
    expect(testnet).toContain('/testnet/');
    expect(pub).toContain('/public/');
    expect(testnet.replace('/testnet/', '/public/')).toBe(pub);
  });
});

describe('networkLabel', () => {
  it('returns "Mainnet" for PUBLIC', () => {
    expect(networkLabel('PUBLIC')).toBe('Mainnet');
  });

  it('returns "Testnet" for TESTNET', () => {
    expect(networkLabel('TESTNET')).toBe('Testnet');
  });

  it('returns "Testnet" for null', () => {
    expect(networkLabel(null)).toBe('Testnet');
  });

  it('returns "Testnet" for undefined', () => {
    expect(networkLabel(undefined)).toBe('Testnet');
  });

  it('returns "Testnet" for an unknown string', () => {
    expect(networkLabel('FUTURENET')).toBe('Testnet');
  });
});
