import { describe, it, expect } from 'vitest';
import {
  contractExplorerUrl,
  getExplorerTxUrl,
  getExplorerAccountUrl,
  networkLabel,
} from '../explorer';

const TESTNET_BASE = 'https://stellar.expert/explorer/testnet';
const PUBLIC_BASE = 'https://stellar.expert/explorer/public';

// Valid 56-character Stellar G-key (account) and C-key (contract)
const G_ADDR = 'GA2C5RFPE6G6KXHEIRHZXSNBR3CJRBGUPTAOOVHRF4AFPS5YUMVSWH7B';
const C_ADDR = 'CA2C5RFPE6G6KXHEIRHZXSNBR3CJRBGUPTAOOVHRF4AFPS5YUMVSWH7B';
const TX_HASH = 'abc123txhash';

describe('getExplorerTxUrl', () => {
  it('builds a testnet tx URL for TESTNET', () => {
    expect(getExplorerTxUrl(TX_HASH, 'TESTNET')).toBe(
      `${TESTNET_BASE}/tx/${TX_HASH}`,
    );
  });

  it('builds a public tx URL for PUBLIC', () => {
    expect(getExplorerTxUrl(TX_HASH, 'PUBLIC')).toBe(
      `${PUBLIC_BASE}/tx/${TX_HASH}`,
    );
  });

  it('defaults to testnet segment for null network', () => {
    expect(getExplorerTxUrl(TX_HASH, null)).toBe(
      `${TESTNET_BASE}/tx/${TX_HASH}`,
    );
  });

  it('URL contains the tx hash', () => {
    expect(getExplorerTxUrl(TX_HASH, 'PUBLIC')).toContain(TX_HASH);
  });
});

describe('getExplorerAccountUrl', () => {
  it('builds a testnet account URL for TESTNET', () => {
    expect(getExplorerAccountUrl(G_ADDR, 'TESTNET')).toBe(
      `${TESTNET_BASE}/account/${G_ADDR}`,
    );
  });

  it('builds a public account URL for PUBLIC', () => {
    expect(getExplorerAccountUrl(G_ADDR, 'PUBLIC')).toBe(
      `${PUBLIC_BASE}/account/${G_ADDR}`,
    );
  });

  it('defaults to testnet segment for null network', () => {
    expect(getExplorerAccountUrl(G_ADDR, null)).toBe(
      `${TESTNET_BASE}/account/${G_ADDR}`,
    );
  });

  it('returns empty string for an invalid address', () => {
    expect(getExplorerAccountUrl('invalid', 'TESTNET')).toBe('');
  });

  it('returns empty string for an empty address', () => {
    expect(getExplorerAccountUrl('', 'PUBLIC')).toBe('');
  });
});

describe('contractExplorerUrl', () => {
  it('builds a testnet contract URL for TESTNET', () => {
    expect(contractExplorerUrl(C_ADDR, 'TESTNET')).toBe(
      `${TESTNET_BASE}/contract/${C_ADDR}`,
    );
  });

  it('builds a public contract URL for PUBLIC', () => {
    expect(contractExplorerUrl(C_ADDR, 'PUBLIC')).toBe(
      `${PUBLIC_BASE}/contract/${C_ADDR}`,
    );
  });

  it('falls back to testnet for an unknown network string', () => {
    expect(contractExplorerUrl(C_ADDR, 'UNKNOWN')).toBe(
      `${TESTNET_BASE}/contract/${C_ADDR}`,
    );
  });

  it('falls back to testnet for an empty network string', () => {
    expect(contractExplorerUrl(C_ADDR, '')).toBe(
      `${TESTNET_BASE}/contract/${C_ADDR}`,
    );
  });

  it('returns an empty string when address is empty', () => {
    expect(contractExplorerUrl('', 'TESTNET')).toBe('');
  });

  it('returns an empty string for an invalid address', () => {
    expect(contractExplorerUrl('notanaddress', 'PUBLIC')).toBe('');
  });

  it('URL contains the exact address passed in', () => {
    const url = contractExplorerUrl(C_ADDR, 'PUBLIC');
    expect(url).toContain(C_ADDR);
  });

  it('testnet and public URLs differ only by the network segment', () => {
    const testnet = contractExplorerUrl(C_ADDR, 'TESTNET');
    const pub = contractExplorerUrl(C_ADDR, 'PUBLIC');
    expect(testnet).toContain('/testnet/');
    expect(pub).toContain('/public/');
    expect(testnet.replace('/testnet/', '/public/')).toBe(pub);
  });

  it('also works with a G-key account address', () => {
    expect(contractExplorerUrl(G_ADDR, 'TESTNET')).toBe(
      `${TESTNET_BASE}/contract/${G_ADDR}`,
    );
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

  it('returns "Testnet" for an empty string', () => {
    expect(networkLabel('')).toBe('Testnet');
  });
});
