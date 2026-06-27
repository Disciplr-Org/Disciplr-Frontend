import { describe, it, expect, vi } from 'vitest';
import { getAtRiskVaults, VaultPreview } from '../atRiskVaults';

describe('getAtRiskVaults', () => {
  const now = new Date('2024-07-01T00:00:00Z');

  const vault = (overrides: Partial<VaultPreview> = {}): VaultPreview => ({
    id: '1',
    name: 'Alpha Vault',
    amount: 12500,
    currency: 'USDC',
    status: 'active',
    progressPct: 50,
    deadline: '2024-07-02T00:00:00Z',
    ...overrides,
  });

  it('returns only active or pending validation vaults with critical or soon urgency', () => {
    const vaults = [
      vault({ id: 'critical', deadline: '2024-07-01T12:00:00Z', status: 'active' }),
      vault({ id: 'soon', deadline: '2024-07-05T00:00:00Z', status: 'pending_validation' }),
      vault({ id: 'safe', deadline: '2024-08-01T00:00:00Z', status: 'active' }),
      vault({ id: 'completed', deadline: '2024-07-01T06:00:00Z', status: 'completed' }),
      vault({ id: 'failed', deadline: '2024-07-01T06:00:00Z', status: 'failed' }),
    ];

    expect(getAtRiskVaults(vaults, now)).toEqual([
      expect.objectContaining({ id: 'critical' }),
      expect.objectContaining({ id: 'soon' }),
    ]);
  });

  it('excludes completed vaults even when deadline is critical', () => {
    const vaults = [
      vault({ id: 'expired-completed', deadline: '2024-07-01T00:00:00Z', status: 'completed' }),
    ];

    expect(getAtRiskVaults(vaults, now)).toEqual([]);
  });

  it('hides vaults with safe urgency', () => {
    const vaults = [
      vault({ id: 'safe-vault', deadline: '2024-07-15T00:00:00Z', status: 'active' }),
    ];

    expect(getAtRiskVaults(vaults, now)).toEqual([]);
  });

  it('handles soon urgency correctly when deadline is within 7 days but more than 24 hours away', () => {
    const vaults = [
      vault({ id: 'soon-vault', deadline: '2024-07-06T00:00:00Z', status: 'active' }),
    ];

    expect(getAtRiskVaults(vaults, now)).toEqual([
      expect.objectContaining({ id: 'soon-vault' }),
    ]);
  });
});
