import { describe, expect, it } from 'vitest';
import { explorerUrl } from '../explorer';

describe('explorerUrl', () => {
  it('builds account, contract, and transaction URLs for TESTNET', () => {
    expect(explorerUrl('TESTNET', 'account', 'GACCOUNT')).toBe(
      'https://stellar.expert/explorer/testnet/account/GACCOUNT',
    );
    expect(explorerUrl('TESTNET', 'contract', 'CCONTRACT')).toBe(
      'https://stellar.expert/explorer/testnet/contract/CCONTRACT',
    );
    expect(explorerUrl('TESTNET', 'tx', 'abc123')).toBe(
      'https://stellar.expert/explorer/testnet/tx/abc123',
    );
  });

  it('builds public network URLs and defaults unknown networks to TESTNET', () => {
    expect(explorerUrl('PUBLIC', 'account', 'GACCOUNT')).toBe(
      'https://stellar.expert/explorer/public/account/GACCOUNT',
    );
    expect(explorerUrl(null, 'tx', 'abc123')).toBe(
      'https://stellar.expert/explorer/testnet/tx/abc123',
    );
    expect(explorerUrl(undefined, 'contract', 'CCONTRACT')).toBe(
      'https://stellar.expert/explorer/testnet/contract/CCONTRACT',
    );
  });

  it('trims and encodes ids while rejecting empty ids', () => {
    expect(explorerUrl('TESTNET', 'tx', ' hash/with space ')).toBe(
      'https://stellar.expert/explorer/testnet/tx/hash%2Fwith%20space',
    );
    expect(explorerUrl('TESTNET', 'tx', '   ')).toBeNull();
  });
});
