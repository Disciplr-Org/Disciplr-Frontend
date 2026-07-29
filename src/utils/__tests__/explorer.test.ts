import { describe, it, expect } from 'vitest';
import { contractExplorerUrl, networkLabel, EXPLORER_BASE_URLS as EXPLORER_BASE_URLS_FROM_EXPLORER } from '../explorer';
import { EXPLORER_BASE_URLS as EXPLORER_BASE_URLS_FROM_HORIZON } from '../horizon';

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

describe('shared explorer base URLs', () => {
  it('reuses the same explorer base URL map from horizon', () => {
    expect(EXPLORER_BASE_URLS_FROM_HORIZON).toBe(EXPLORER_BASE_URLS_FROM_EXPLORER);
    expect(EXPLORER_BASE_URLS_FROM_HORIZON.TESTNET).toBe(EXPLORER_BASE_URLS_FROM_EXPLORER.TESTNET);
    expect(EXPLORER_BASE_URLS_FROM_HORIZON.PUBLIC).toBe(EXPLORER_BASE_URLS_FROM_EXPLORER.PUBLIC);
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
