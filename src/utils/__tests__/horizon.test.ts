import { describe, expect, test, vi } from 'vitest';
import { fetchUsdcBalance, horizonUrl } from '../horizon';

describe('horizonUrl', () => {
  test('returns network-specific Horizon endpoints', () => {
    expect(horizonUrl('TESTNET')).toBe('https://horizon-testnet.stellar.org');
    expect(horizonUrl('PUBLIC')).toBe('https://horizon.stellar.org');
  });
});

describe('fetchUsdcBalance', () => {
  test('returns the USDC balance from Horizon account balances', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        balances: [
          { asset_type: 'native', balance: '7.0000000' },
          { asset_type: 'credit_alphanum4', asset_code: 'USDC', balance: '42.5000000' },
        ],
      }),
    });

    await expect(fetchUsdcBalance('GABC', 'TESTNET', fetcher)).resolves.toEqual({
      balance: '42.5000000',
      hasTrustline: true,
    });
    expect(fetcher).toHaveBeenCalledWith('https://horizon-testnet.stellar.org/accounts/GABC');
  });

  test('returns zero when the account has no USDC trustline', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ balances: [{ asset_type: 'native', balance: '3.0000000' }] }),
    });

    await expect(fetchUsdcBalance('GABC', 'PUBLIC', fetcher)).resolves.toEqual({
      balance: '0.00',
      hasTrustline: false,
    });
  });

  test('treats missing Horizon accounts as zero balance without a trustline', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(fetchUsdcBalance('GABC', 'TESTNET', fetcher)).resolves.toEqual({
      balance: '0.00',
      hasTrustline: false,
    });
  });

  test('throws on non-404 Horizon failures', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchUsdcBalance('GABC', 'TESTNET', fetcher)).rejects.toThrow(
      'Horizon account lookup failed with 500',
    );
  });
});
